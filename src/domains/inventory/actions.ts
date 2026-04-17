'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, getCompanyId } from '@/lib/supabase/server'
import type { Developer, Project, Unit } from '@/lib/types/db'

// ─── DEVELOPERS ──────────────────────────────────────────────────

export async function getDevelopers() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('developers')
    .select('*')
    .order('name')
  return (data ?? []) as Developer[]
}

export async function getDeveloper(id: string) {
  const supabase = await createServerClient()
  const [{ data: dev }, { data: projects }] = await Promise.all([
    supabase.from('developers').select('*').eq('id', id).single(),
    supabase.from('projects').select('*, units(count)').eq('developer_id', id).order('name'),
  ])
  return { developer: dev as Developer | null, projects: projects ?? [] }
}

export async function upsertDeveloper(input: Partial<Developer> & { name: string }) {
  const supabase = await createServerClient()
  const { id, ...rest } = input
  if (id) {
    const { error } = await supabase.from('developers').update(rest).eq('id', id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('developers').insert(rest)
    if (error) return { success: false, error: error.message }
  }
  revalidatePath('/dashboard/inventory/developers')
  return { success: true }
}

// ─── PROJECTS ────────────────────────────────────────────────────

export async function getProjects(developerId?: string) {
  const supabase = await createServerClient()
  let q = supabase
    .from('projects')
    .select('*, developers(name)')
    .order('name')
  if (developerId) q = q.eq('developer_id', developerId)
  const { data } = await q
  return (data ?? []) as (Project & { developers: { name: string } | null })[]
}

export async function getProject(id: string) {
  const supabase = await createServerClient()
  const [{ data: project }, { data: units }] = await Promise.all([
    supabase.from('projects').select('*, developers(*)').eq('id', id).single(),
    supabase.from('units').select('*').eq('project_id', id).order('unit_number'),
  ])
  return {
    project: project as (Project & { developers: Developer | null }) | null,
    units:   (units ?? []) as Unit[],
  }
}

export async function upsertProject(input: Partial<Project> & { name: string }) {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()
  const { id, ...rest } = input
  const payload = { ...rest, company_id: companyId, updated_at: new Date().toISOString() }

  if (id) {
    const { error } = await supabase.from('projects').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('projects').insert(payload)
    if (error) return { success: false, error: error.message }
  }
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/inventory/projects')
  return { success: true }
}

// ─── UNITS ───────────────────────────────────────────────────────

export async function getUnits(opts?: {
  projectId?: string
  status?: string
  unitType?: string
  minPrice?: number
  maxPrice?: number
  page?: number
}) {
  const supabase = await createServerClient()
  const pageSize = 40
  const page = opts?.page ?? 1
  const from = (page - 1) * pageSize

  let q = supabase
    .from('units')
    .select('*, projects(name, commission_pct, developer_id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (opts?.projectId) q = q.eq('project_id', opts.projectId)
  if (opts?.status)    q = q.eq('status', opts.status)
  if (opts?.unitType)  q = q.eq('unit_type', opts.unitType)
  if (opts?.minPrice)  q = q.gte('price', opts.minPrice)
  if (opts?.maxPrice)  q = q.lte('price', opts.maxPrice)

  const { data, count } = await q
  return { units: (data ?? []) as (Unit & { projects: Pick<Project, 'name' | 'commission_pct'> | null })[], total: count ?? 0 }
}

export async function getUnit(id: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('units')
    .select('*, projects(*, developers(*))')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateUnitStatus(unitId: string, status: string, reservedBy?: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('units').update({
    status,
    reserved_by: reservedBy ?? null,
    reserved_at: reservedBy ? new Date().toISOString() : null,
    updated_at:  new Date().toISOString(),
  }).eq('id', unitId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/inventory/units')
  return { success: true }
}

export async function upsertUnit(input: Partial<Unit> & { project_id: string }) {
  const supabase = await createServerClient()
  const { id, ...rest } = input
  const payload = { ...rest, updated_at: new Date().toISOString() }

  if (id) {
    const { error } = await supabase.from('units').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('units').insert(payload)
    if (error) return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/inventory/projects/${input.project_id}`)
  revalidatePath('/dashboard/inventory/units')
  return { success: true }
}

// ─── INVENTORY STATS ─────────────────────────────────────────────

export async function getInventoryStats() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('units')
    .select('status, price, unit_type')

  const units = data ?? []
  return {
    total:       units.length,
    available:   units.filter(u => u.status === 'available').length,
    reserved:    units.filter(u => u.status === 'reserved').length,
    sold:        units.filter(u => u.status === 'sold').length,
    totalValue:  units.filter(u => u.status === 'available').reduce((s, u) => s + Number(u.price ?? 0), 0),
  }
}

// ─── MATCHING: find best units for a buyer ───────────────────────

export async function matchUnitsForBuyer(leadId: string) {
  const supabase = await createServerClient()

  const { data: req } = await supabase
    .from('buyer_requirements')
    .select('*')
    .eq('lead_id', leadId)
    .single()

  if (!req) return []

  let q = supabase
    .from('units')
    .select('*, projects(name, location, commission_pct)')
    .eq('status', 'available')

  if (req.min_budget)   q = q.gte('price', req.min_budget)
  if (req.max_budget)   q = q.lte('price', req.max_budget)
  if (req.min_bedrooms) q = q.gte('bedrooms', req.min_bedrooms)
  if (req.max_bedrooms) q = q.lte('bedrooms', req.max_bedrooms)
  if (req.property_types?.length) q = q.in('unit_type', req.property_types)

  const { data: units } = await q.limit(20)

  return (units ?? []).map(u => {
    let score = 0
    const price = Number(u.price ?? 0)
    const budget = Number(req.max_budget ?? Infinity)
    const budgetFit = price <= budget ? 1 - (budget - price) / budget : 0
    score += Math.round(budgetFit * 40)
    if (req.min_bedrooms && u.bedrooms && u.bedrooms >= req.min_bedrooms) score += 20
    if (req.property_types?.includes(u.unit_type ?? '')) score += 20
    if (req.min_area_sqm && u.area_sqm && u.area_sqm >= req.min_area_sqm) score += 10
    if (req.finishing?.includes(u.finishing ?? '')) score += 10
    return { ...u, matchScore: Math.min(score, 100) }
  }).sort((a, b) => b.matchScore - a.matchScore)
}
