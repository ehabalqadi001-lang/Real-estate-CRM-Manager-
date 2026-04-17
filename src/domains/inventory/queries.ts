import 'server-only'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { DeveloperOption, InventoryOverview, InventoryUnitCard } from './types'
import { getUnits } from './units'

type RawInventoryRow = Record<string, unknown> & {
  id?: string
  unit_name?: string | null
  unit_number?: string | null
  compound?: string | null
  project_name?: string | null
  unit_type?: string | null
  property_type?: string | null
  price?: number | string | null
  status?: string | null
  floor?: number | string | null
  area?: number | string | null
  developers?: { name?: string | null } | null
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeInventoryUnit(row: RawInventoryRow): InventoryUnitCard {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    status: String(row.status ?? 'available').toLowerCase(),
    unit_name: row.unit_name ?? row.unit_number ?? row.compound ?? 'وحدة',
    project_name: row.project_name ?? row.compound ?? 'مشروع',
    unit_type: row.unit_type ?? row.property_type ?? 'شقة',
    price: toNumber(row.price),
    floor: row.floor == null ? undefined : toNumber(row.floor),
    area: row.area == null ? undefined : toNumber(row.area),
    developer: row.developers?.name ?? undefined,
  }
}

function calculateOverview(units: InventoryUnitCard[]): Omit<InventoryOverview, 'units' | 'projects' | 'error' | 'errorDetails'> {
  const available = units.filter((unit) => unit.status === 'available').length
  const reserved = units.filter((unit) => unit.status === 'reserved').length
  const sold = units.filter((unit) => unit.status === 'sold').length
  const totalValue = units
    .filter((unit) => unit.status === 'available')
    .reduce((sum, unit) => sum + Number(unit.price || 0), 0)

  return {
    stats: {
      available,
      reserved,
      sold,
      totalValue,
      averagePrice: available > 0 ? totalValue / available : 0,
      soldRate: units.length > 0 ? ((sold / units.length) * 100).toFixed(0) : '0',
    },
  }
}

export async function getDeveloperOptions(): Promise<DeveloperOption[]> {
  await requirePermission('developer.view')
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('developers')
    .select('id, name')
    .order('name')

  return (data ?? []) as DeveloperOption[]
}

export async function getInventoryOverview(): Promise<InventoryOverview> {
  await requirePermission('unit.view')
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, developers(name)')
      .order('created_at', { ascending: false })

    if (error) {
      return {
        units: [],
        projects: [],
        ...calculateOverview([]),
        error: 'تعذر جلب بيانات المخزون العقاري.',
        errorDetails: error.message,
      }
    }

    const units = ((data ?? []) as RawInventoryRow[]).map(normalizeInventoryUnit)
    const projects = Array.from(new Set(units.map((unit) => unit.project_name).filter(Boolean)))

    return {
      units,
      projects,
      ...calculateOverview(units),
      error: null,
      errorDetails: null,
    }
  } catch (error) {
    return {
      units: [],
      projects: [],
      ...calculateOverview([]),
      error: 'تعذر جلب بيانات المخزون العقاري.',
      errorDetails: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getInventoryStats() {
  const { units } = await getUnits({ pageSize: 10_000 })

  return {
    total: units.length,
    available: units.filter((unit) => unit.status === 'available').length,
    reserved: units.filter((unit) => unit.status === 'reserved').length,
    sold: units.filter((unit) => unit.status === 'sold').length,
    totalValue: units
      .filter((unit) => unit.status === 'available')
      .reduce((sum, unit) => sum + Number(unit.price ?? 0), 0),
  }
}
