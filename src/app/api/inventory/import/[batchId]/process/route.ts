import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { nullableUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ batchId: string }>
}

type IngestionRow = {
  id: string
  row_number: number
  mapped_payload: {
    developer_name?: string
    project_name?: string
    unit_number?: string
    building?: string
    floor_number?: number | null
    unit_type?: string
    area_sqm?: number | null
    price?: number | null
    status?: string
    down_payment?: number | null
    monthly_installment?: number | null
    installment_years?: number | null
  }
}

type ProcessStats = {
  processed: number
  failed: number
  createdProjects: number
  createdUnits: number
  updatedUnits: number
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession()
    if (!hasPermission(session.profile.role, 'inventory.import')) {
      return NextResponse.json({ error: 'غير مصرح لك بمعالجة ملفات المخزون.' }, { status: 403 })
    }

    const { batchId: rawBatchId } = await context.params
    const batchId = nullableUuid(rawBatchId)
    if (!batchId) {
      return NextResponse.json({ error: 'معرف batch غير صحيح.' }, { status: 400 })
    }

    const service = createServiceRoleClient()
    const { data: batch, error: batchError } = await service
      .from('inventory_ingestion_batches')
      .select('id, developer_id, company_id, source_type')
      .eq('id', batchId)
      .maybeSingle()

    if (batchError) throw batchError
    if (!batch) return NextResponse.json({ error: 'ملف الاستيراد غير موجود.' }, { status: 404 })

    const companyId = nullableUuid(batch.company_id) ?? nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)
    if (!companyId && session.profile.role !== 'super_admin' && session.profile.role !== 'platform_admin') {
      return NextResponse.json({ error: 'لا يمكن معالجة batch بدون شركة مرتبطة.' }, { status: 400 })
    }

    await service
      .from('inventory_ingestion_batches')
      .update({ status: 'processing' })
      .eq('id', batch.id)

    const { data: rows, error: rowsError } = await service
      .from('inventory_ingestion_rows')
      .select('id, row_number, mapped_payload')
      .eq('batch_id', batch.id)
      .order('row_number')

    if (rowsError) throw rowsError

    const stats: ProcessStats = {
      processed: 0,
      failed: 0,
      createdProjects: 0,
      createdUnits: 0,
      updatedUnits: 0,
    }

    const developerCache = new Map<string, string>()
    const projectCache = new Map<string, string>()

    for (const row of ((rows ?? []) as IngestionRow[])) {
      try {
        const payload = row.mapped_payload ?? {}
        if (!payload.project_name || !payload.unit_number || !payload.price) {
          throw new Error('اسم المشروع ورقم الوحدة والسعر مطلوبة.')
        }

        const developerId = await resolveDeveloperId({
          service,
          companyId,
          batchDeveloperId: batch.developer_id,
          developerName: payload.developer_name,
          cache: developerCache,
        })
        const projectId = await resolveProjectId({
          service,
          companyId,
          developerId,
          projectName: payload.project_name,
          cache: projectCache,
          stats,
        })

        const { data: existingUnit, error: existingError } = await service
          .from('units')
          .select('id, price, status')
          .eq('project_id', projectId)
          .eq('unit_number', payload.unit_number)
          .maybeSingle()

        if (existingError) throw existingError

        const unitPayload = {
          company_id: companyId,
          project_id: projectId,
          unit_number: payload.unit_number,
          building: payload.building || null,
          floor_number: payload.floor_number ?? null,
          unit_type: payload.unit_type ?? 'apartment',
          area_sqm: payload.area_sqm ?? 1,
          price: payload.price,
          status: payload.status ?? 'available',
          down_payment: payload.down_payment ?? null,
          monthly_installment: payload.monthly_installment ?? null,
          installment_years: payload.installment_years ?? null,
          availability_source: batch.source_type,
          last_synced_at: new Date().toISOString(),
          inventory_hash: `${projectId}:${payload.unit_number}:${payload.price}:${payload.status ?? 'available'}`,
        }

        let unitId: string
        if (existingUnit?.id) {
          const { error: updateError } = await service.from('units').update(unitPayload).eq('id', existingUnit.id)
          if (updateError) throw updateError
          unitId = existingUnit.id
          stats.updatedUnits += 1

          if (Number(existingUnit.price ?? 0) !== Number(payload.price) || existingUnit.status !== unitPayload.status) {
            await service.from('unit_price_history').insert({
              unit_id: unitId,
              developer_id: developerId,
              old_price: existingUnit.price ?? null,
              new_price: payload.price,
              old_status: existingUnit.status ?? null,
              new_status: unitPayload.status,
              source_type: batch.source_type,
              batch_id: batch.id,
              changed_by: session.user.id,
            })
          }
        } else {
          const { data: createdUnit, error: insertError } = await service
            .from('units')
            .insert(unitPayload)
            .select('id')
            .single()
          if (insertError) throw insertError
          unitId = createdUnit.id
          stats.createdUnits += 1
          await service.from('unit_price_history').insert({
            unit_id: unitId,
            developer_id: developerId,
            new_price: payload.price,
            new_status: unitPayload.status,
            source_type: batch.source_type,
            batch_id: batch.id,
            changed_by: session.user.id,
          })
        }

        await service
          .from('inventory_ingestion_rows')
          .update({ status: 'processed', target_table: 'units', target_id: unitId, error_message: null })
          .eq('id', row.id)

        stats.processed += 1
      } catch (rowError) {
        stats.failed += 1
        await service
          .from('inventory_ingestion_rows')
          .update({
            status: 'failed',
            error_message: rowError instanceof Error ? rowError.message : 'تعذر معالجة الصف.',
          })
          .eq('id', row.id)
      }
    }

    const finalStatus = stats.failed === 0 ? 'completed' : stats.processed === 0 ? 'failed' : 'partially_completed'
    await service
      .from('inventory_ingestion_batches')
      .update({
        status: finalStatus,
        processed_rows: stats.processed,
        failed_rows: stats.failed,
        error_summary: stats.failed ? `${stats.failed} صفوف لم تتم معالجتها.` : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id)

    return NextResponse.json({ success: true, batchId: batch.id, ...stats })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'تعذر معالجة ملف المخزون.',
    }, { status: 500 })
  }
}

async function resolveDeveloperId(input: {
  service: ReturnType<typeof createServiceRoleClient>
  companyId: string | null
  batchDeveloperId: string | null
  developerName: string | undefined
  cache: Map<string, string>
}) {
  const existingBatchDeveloperId = nullableUuid(input.batchDeveloperId)
  if (existingBatchDeveloperId) return existingBatchDeveloperId

  const name = (input.developerName || 'مطور غير محدد').trim()
  const key = name.toLowerCase()
  const cached = input.cache.get(key)
  if (cached) return cached

  const { data: existingByArabicName } = await input.service
    .from('developers')
    .select('id')
    .eq('name_ar', name)
    .maybeSingle()

  if (existingByArabicName?.id) {
    input.cache.set(key, existingByArabicName.id)
    return existingByArabicName.id
  }

  const { data: existingByName } = await input.service
    .from('developers')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (existingByName?.id) {
    input.cache.set(key, existingByName.id)
    return existingByName.id
  }

  const { data: created, error } = await input.service
    .from('developers')
    .insert({
      name,
      name_ar: name,
      active: true,
      tier: 'standard',
      description: 'تم إنشاؤه تلقائياً من ملف استيراد المخزون.',
    })
    .select('id')
    .single()

  if (error) throw error
  input.cache.set(key, created.id)
  return created.id
}

async function resolveProjectId(input: {
  service: ReturnType<typeof createServiceRoleClient>
  companyId: string | null
  developerId: string
  projectName: string
  cache: Map<string, string>
  stats: ProcessStats
}) {
  const name = input.projectName.trim()
  const key = `${input.developerId}:${name.toLowerCase()}`
  const cached = input.cache.get(key)
  if (cached) return cached

  const { data: existingByArabicName } = await input.service
    .from('projects')
    .select('id')
    .eq('developer_id', input.developerId)
    .eq('name_ar', name)
    .maybeSingle()

  if (existingByArabicName?.id) {
    input.cache.set(key, existingByArabicName.id)
    return existingByArabicName.id
  }

  const { data: existingByName } = await input.service
    .from('projects')
    .select('id')
    .eq('developer_id', input.developerId)
    .eq('name', name)
    .maybeSingle()

  if (existingByName?.id) {
    input.cache.set(key, existingByName.id)
    return existingByName.id
  }

  const { data: created, error } = await input.service
    .from('projects')
    .insert({
      company_id: input.companyId,
      developer_id: input.developerId,
      name,
      name_ar: name,
      location: 'غير محدد',
      city: 'القاهرة',
      project_type: 'residential',
      status: 'active',
    })
    .select('id')
    .single()

  if (error) throw error
  input.stats.createdProjects += 1
  input.cache.set(key, created.id)
  return created.id
}
