'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { mapInventoryRowWithMapping, type ParsedInventoryRow } from '@/lib/inventory/import-parser'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { nullableUuid } from '@/lib/uuid'

export type MappingReviewState = {
  ok: boolean
  message: string
}

export async function updateBatchMappingAction(
  _prev: MappingReviewState,
  formData: FormData,
): Promise<MappingReviewState> {
  try {
    const session = await requireSession()
    if (!hasPermission(session.profile.role, 'inventory.import')) {
      return { ok: false, message: 'غير مصرح لك بمراجعة ملفات المخزون.' }
    }

    const batchId = nullableUuid(formData.get('batchId'))
    if (!batchId) return { ok: false, message: 'معرف ملف الاستيراد غير صحيح.' }

    const mappingEntries = Array.from(formData.entries())
      .filter(([key]) => key.startsWith('mapping:'))
      .map(([key, value]) => [key.replace('mapping:', ''), String(value)] as const)

    const mapping = Object.fromEntries(mappingEntries.filter(([, value]) => value && value !== 'ignore'))
    const service = createServiceRoleClient()

    const { data: batch, error: batchError } = await service
      .from('inventory_ingestion_batches')
      .select('id, mapping_payload')
      .eq('id', batchId)
      .maybeSingle()

    if (batchError) throw batchError
    if (!batch) return { ok: false, message: 'ملف الاستيراد غير موجود.' }

    const { data: rows, error: rowsError } = await service
      .from('inventory_ingestion_rows')
      .select('id, raw_payload')
      .eq('batch_id', batchId)
      .order('row_number')

    if (rowsError) throw rowsError

    let failedRows = 0
    for (const row of rows ?? []) {
      const mapped = mapInventoryRowWithMapping(row.raw_payload as ParsedInventoryRow, mapping)
      const valid = Boolean(mapped.project_name && mapped.unit_number && mapped.price)
      if (!valid) failedRows += 1

      const { error: updateError } = await service
        .from('inventory_ingestion_rows')
        .update({
          mapped_payload: mapped,
          status: 'pending',
          error_message: valid ? null : 'اسم المشروع ورقم الوحدة والسعر مطلوبة.',
        })
        .eq('id', row.id)

      if (updateError) throw updateError
    }

    const existingPayload = (batch.mapping_payload ?? {}) as Record<string, unknown>
    const { error: updateBatchError } = await service
      .from('inventory_ingestion_batches')
      .update({
        status: 'pending',
        processed_rows: 0,
        failed_rows: failedRows,
        completed_at: null,
        mapping_payload: {
          ...existingPayload,
          detected_mapping: mapping,
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.user.id,
          review_required: false,
          valid_rows: Number(rows?.length ?? 0) - failedRows,
        },
        error_summary: failedRows ? `${failedRows} صفوف تحتاج استكمال قبل المعالجة.` : null,
      })
      .eq('id', batchId)

    if (updateBatchError) throw updateBatchError

    revalidatePath('/dashboard/integrations')
    revalidatePath(`/dashboard/integrations/batches/${batchId}`)

    return { ok: true, message: 'تم تحديث mapping وحفظ الصفوف للمراجعة النهائية.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر حفظ مراجعة mapping.' }
  }
}
