import 'server-only'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerSupabaseClient } from '@/shared/supabase/server'

interface BuyerRequirementRow {
  min_budget?: number | null
  max_budget?: number | null
  min_bedrooms?: number | null
  max_bedrooms?: number | null
  min_area_sqm?: number | null
  property_types?: string[] | null
  finishing?: string[] | null
}

interface MatchableUnit {
  price?: number | null
  bedrooms?: number | null
  area_sqm?: number | null
  unit_type?: string | null
  finishing?: string | null
}

function scoreUnit(unit: MatchableUnit, requirement: BuyerRequirementRow) {
  let score = 0
  const price = Number(unit.price ?? 0)
  const maxBudget = Number(requirement.max_budget ?? Infinity)
  const budgetFit = price <= maxBudget && Number.isFinite(maxBudget) ? 1 - (maxBudget - price) / maxBudget : 0

  score += Math.round(Math.max(0, budgetFit) * 40)

  if (requirement.min_bedrooms && unit.bedrooms && unit.bedrooms >= requirement.min_bedrooms) score += 20
  if (requirement.property_types?.includes(unit.unit_type ?? '')) score += 20
  if (requirement.min_area_sqm && unit.area_sqm && unit.area_sqm >= requirement.min_area_sqm) score += 10
  if (requirement.finishing?.includes(unit.finishing ?? '')) score += 10

  return Math.min(score, 100)
}

export async function matchUnitsForBuyer(leadId: string) {
  await requirePermission('unit.view')
  const supabase = await createServerSupabaseClient()

  const { data: requirement } = await supabase
    .from('buyer_requirements')
    .select('*')
    .eq('lead_id', leadId)
    .single()

  if (!requirement) return []

  const req = requirement as BuyerRequirementRow
  let query = supabase
    .from('units')
    .select('*, projects(name, location, commission_pct)')
    .eq('status', 'available')

  if (req.min_budget) query = query.gte('price', req.min_budget)
  if (req.max_budget) query = query.lte('price', req.max_budget)
  if (req.min_bedrooms) query = query.gte('bedrooms', req.min_bedrooms)
  if (req.max_bedrooms) query = query.lte('bedrooms', req.max_bedrooms)
  if (req.property_types?.length) query = query.in('unit_type', req.property_types)

  const { data: units } = await query.limit(20)

  return (units ?? [])
    .map((unit) => ({ ...unit, matchScore: scoreUnit(unit as MatchableUnit, req) }))
    .sort((a, b) => b.matchScore - a.matchScore)
}
