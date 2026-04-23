import 'server-only'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { ActionResult } from '@/shared/types/action-result'
import type { BulkInventoryUnitInput, CreateInventoryUnitInput } from './types'

function textValue(value: unknown, fallback: string) {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function priceValue(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? '0'))
  return Number.isFinite(parsed) ? parsed : 0
}

export async function createInventoryUnit(input: CreateInventoryUnitInput): Promise<ActionResult> {
  await requirePermission('unit.manage')
  const supabase = await createServerSupabaseClient()

  if (!input.unit_name.trim() || !input.developer_id.trim() || !input.unit_type.trim()) {
    return { ok: false, error: 'بيانات الوحدة الأساسية مطلوبة', code: 'VALIDATION_ERROR' }
  }

  const { error } = await supabase.from('inventory').insert([{
    unit_name: input.unit_name.trim(),
    developer_id: input.developer_id.trim(),
    unit_type: input.unit_type.trim(),
    price: input.price,
    area_sqm: input.area_sqm ?? null,
    status: input.status || 'available',
    description: input.description?.trim() || null,
  }])

  if (error) {
    return { ok: false, error: error.message, code: 'DATABASE_ERROR' }
  }

  return { ok: true, data: undefined }
}

export async function createBulkInventoryUnits(input: BulkInventoryUnitInput): Promise<ActionResult<{ inserted: number }>> {
  await requirePermission('unit.manage')
  const supabase = await createServerSupabaseClient()

  if (!input.developer_id.trim()) {
    return { ok: false, error: 'يجب اختيار المطور العقاري', code: 'VALIDATION_ERROR' }
  }

  const payload = input.rows.map((unit) => ({
    unit_name: textValue(unit['اسم الوحدة'] ?? unit['Unit Name'], 'وحدة غير مسماة'),
    unit_type: textValue(unit['النوع'] ?? unit['Type'], 'غير محدد'),
    price: priceValue(unit['السعر'] ?? unit['Price']),
    status: 'available',
    developer_id: input.developer_id,
  }))

  if (payload.length === 0) {
    return { ok: false, error: 'ملف الاستيراد لا يحتوي على وحدات', code: 'VALIDATION_ERROR' }
  }

  const { error } = await supabase.from('inventory').insert(payload)

  if (error) {
    return { ok: false, error: error.message, code: 'DATABASE_ERROR' }
  }

  return { ok: true, data: { inserted: payload.length } }
}
