import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { nullableUuid } from '@/lib/uuid'
import { detectMapping, mapInventoryRow, parseInventoryFile } from '@/lib/inventory/import-parser'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 15 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()

    if (!hasPermission(session.profile.role, 'inventory.import')) {
      return NextResponse.json({ error: 'غير مصرح لك باستيراد مخزون المطورين.' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const developerId = nullableUuid(formData.get('developerId'))
    const companyId = nullableUuid(formData.get('companyId')) ?? nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)

    if (!file) {
      return NextResponse.json({ error: 'ارفع ملف CSV أو XLSX أولاً.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'حجم الملف أكبر من الحد المسموح 15MB.' }, { status: 400 })
    }

    if (!companyId && session.profile.role !== 'super_admin' && session.profile.role !== 'platform_admin') {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بحسابك لاستيراد المخزون.' }, { status: 400 })
    }

    const sourceType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel'
    const rows = await parseInventoryFile(file)
    const mappedRows = rows.map((row) => mapInventoryRow(row))
    const headers = rows[0] ? Object.keys(rows[0]) : []
    const mapping = detectMapping(headers)
    const failedRows = mappedRows.filter((row) => !row.project_name || !row.unit_number || !row.price).length
    const status = failedRows === 0 ? 'completed' : failedRows === mappedRows.length ? 'failed' : 'partially_completed'
    const now = new Date().toISOString()
    const supabase = await createServerSupabaseClient()

    const { data: batch, error: batchError } = await supabase
      .from('inventory_ingestion_batches')
      .insert({
        developer_id: developerId,
        company_id: companyId,
        source_type: sourceType,
        source_name: file.name,
        status,
        total_rows: mappedRows.length,
        processed_rows: mappedRows.length - failedRows,
        failed_rows: failedRows,
        mapping_payload: {
          detected_mapping: mapping,
          headers,
          file_size: file.size,
          mime_type: file.type,
        },
        error_summary: failedRows ? `${failedRows} صفوف تحتاج مراجعة قبل تطبيقها على المخزون.` : null,
        created_by: session.user.id,
        completed_at: now,
      })
      .select('id')
      .single()

    if (batchError) throw batchError

    if (mappedRows.length) {
      const rowPayload = mappedRows.map((mapped, index) => ({
        batch_id: batch.id,
        row_number: index + 2,
        raw_payload: rows[index] ?? {},
        mapped_payload: mapped,
        target_table: 'units',
        status: mapped.project_name && mapped.unit_number && mapped.price ? 'processed' : 'failed',
        error_message: mapped.project_name && mapped.unit_number && mapped.price ? null : 'اسم المشروع ورقم الوحدة والسعر مطلوبة.',
      }))

      const { error: rowsError } = await supabase.from('inventory_ingestion_rows').insert(rowPayload)
      if (rowsError) throw rowsError
    }

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalRows: mappedRows.length,
      processedRows: mappedRows.length - failedRows,
      failedRows,
      mapping,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'تعذر استيراد ملف المخزون.',
    }, { status: 500 })
  }
}
