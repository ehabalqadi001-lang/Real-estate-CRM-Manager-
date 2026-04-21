'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDeveloperOptions } from '@/domains/inventory/queries'
import { createBulkInventoryUnits, createInventoryUnit } from '@/domains/inventory/mutations'
import { upsertUnit as _upsertUnit } from '@/domains/inventory/units'
import type { Unit } from '@/lib/types/db'
import { createRawClient } from '@/lib/supabase/server'

export async function getDevelopersList() {
  return getDeveloperOptions()
}

export async function addSingleUnit(formData: FormData) {
  const result = await createInventoryUnit({
    unit_name: String(formData.get('unit_name') ?? ''),
    developer_id: String(formData.get('developer_id') ?? ''),
    unit_type: String(formData.get('unit_type') ?? ''),
    price: Number.parseFloat(String(formData.get('price') ?? '0')) || 0,
    area_sqm: Number.parseFloat(String(formData.get('area_sqm') ?? '0')) || undefined,
    status: String(formData.get('status') ?? 'available'),
    description: String(formData.get('description') ?? ''),
  })

  if (!result.ok) {
    throw new Error(result.error)
  }

  revalidatePath('/dashboard/inventory')
}

export async function addBulkUnits(units: Record<string, unknown>[], developer_id: string) {
  const result = await createBulkInventoryUnits({
    rows: units,
    developer_id,
  })

  if (!result.ok) {
    throw new Error(result.error)
  }

  revalidatePath('/dashboard/inventory')
  return result.data
}

export async function upsertUnit(input: Partial<Unit> & { project_id: string }) {
  return _upsertUnit(input)
}

export interface HoldUnitResult {
  ok: boolean
  message: string
  heldUntil?: string
}

export async function holdInventoryUnit(unitId: string): Promise<HoldUnitResult> {
  const supabase = await createRawClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const heldUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .or(`id.eq.${user.id},email.eq.${user.email ?? ''}`)
    .maybeSingle()

  const { data: unit, error: readError } = await supabase
    .from('units')
    .select('status, held_until')
    .eq('id', unitId)
    .single()

  if (readError) {
    return { ok: false, message: 'تعذر قراءة بيانات الوحدة.' }
  }

  if (unit?.status === 'sold' || unit?.status === 'reserved') {
    return { ok: false, message: 'لا يمكن احتجاز وحدة مباعة أو محجوزة.' }
  }

  if (unit?.status === 'held' && unit.held_until && new Date(unit.held_until).getTime() > Date.now()) {
    return { ok: false, message: 'هذه الوحدة محتجزة بالفعل.' }
  }

  const { error } = await supabase
    .from('units')
    .update({
      status: 'held',
      held_by: agent?.id ?? null,
      held_until: heldUntil,
      updated_at: new Date().toISOString(),
    })
    .eq('id', unitId)

  if (error) {
    return { ok: false, message: error.message }
  }

  revalidatePath('/dashboard/inventory')
  revalidatePath('/inventory')
  return { ok: true, message: 'تم احتجاز الوحدة لمدة ٤٨ ساعة.', heldUntil }
}

export async function releaseExpiredHoldsForInventory(): Promise<number> {
  const supabase = await createRawClient()
  const { data, error } = await supabase.rpc('release_expired_unit_holds')

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/inventory')
  return Number(data ?? 0)
}
