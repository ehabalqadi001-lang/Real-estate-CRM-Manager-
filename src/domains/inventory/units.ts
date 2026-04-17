import 'server-only'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { Developer, Project, Unit } from '@/lib/types/db'
import type { ActionResult } from '@/shared/types/action-result'

export interface UnitListFilters {
  projectId?: string
  status?: string
  unitType?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  pageSize?: number
}

export type UnitListItem = Unit & {
  projects: Pick<Project, 'name' | 'commission_pct' | 'developer_id'> | null
}

export type UnitDetail = Unit & {
  projects: (Project & { developers: Developer | null }) | null
  price_per_sqm?: number | null
  orientation?: string | null
  delivery_date?: string | null
  description?: string | null
}

export interface UnitListResult {
  units: UnitListItem[]
  total: number
}

export async function getUnits(filters: UnitListFilters = {}): Promise<UnitListResult> {
  await requirePermission('unit.view')
  const supabase = await createServerSupabaseClient()
  const pageSize = filters.pageSize ?? 40
  const page = Math.max(1, filters.page ?? 1)
  const from = (page - 1) * pageSize

  let query = supabase
    .from('units')
    .select('*, projects(name, commission_pct, developer_id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (filters.projectId) query = query.eq('project_id', filters.projectId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.unitType) query = query.eq('unit_type', filters.unitType)
  if (filters.minPrice) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice) query = query.lte('price', filters.maxPrice)

  const { data, count } = await query

  return {
    units: (data ?? []) as UnitListItem[],
    total: count ?? 0,
  }
}

export async function getUnit(id: string): Promise<UnitDetail> {
  await requirePermission('unit.view')
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('units')
    .select('*, projects(*, developers(*))')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as UnitDetail
}

export async function updateUnitStatus(unitId: string, status: string, reservedBy?: string): Promise<ActionResult> {
  await requirePermission('unit.manage')
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('units')
    .update({
      status,
      reserved_by: reservedBy ?? null,
      reserved_at: reservedBy ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', unitId)

  if (error) {
    return { ok: false, error: error.message, code: 'DATABASE_ERROR' }
  }

  revalidatePath('/dashboard/inventory/units')
  revalidatePath(`/dashboard/inventory/units/${unitId}`)
  return { ok: true, data: undefined }
}

export async function upsertUnit(input: Partial<Unit> & { project_id: string }): Promise<ActionResult> {
  await requirePermission('unit.manage')
  const supabase = await createServerSupabaseClient()
  const { id, ...rest } = input
  const payload = { ...rest, updated_at: new Date().toISOString() }

  const result = id
    ? await supabase.from('units').update(payload).eq('id', id)
    : await supabase.from('units').insert(payload)

  if (result.error) {
    return { ok: false, error: result.error.message, code: 'DATABASE_ERROR' }
  }

  revalidatePath(`/dashboard/inventory/projects/${input.project_id}`)
  revalidatePath('/dashboard/inventory/units')
  return { ok: true, data: undefined }
}
