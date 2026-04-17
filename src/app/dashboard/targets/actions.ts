'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

function getSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

export interface AgentTarget {
  id: string
  agent_id: string
  agent_name?: string
  month: string          // YYYY-MM
  revenue_target: number
  deals_target: number
  leads_target: number
  revenue_actual: number
  deals_actual: number
  leads_actual: number
}

export async function getTargets(month: string) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { data: targets } = await supabase
    .from('agent_targets')
    .select('*, profiles(full_name)')
    .eq('month', month)
    .order('created_at', { ascending: false })

  if (!targets) return []

  // Batch fetch actuals — 2 queries total instead of 2N
  const startDate = `${month}-01`
  const [year, mon] = month.split('-').map(Number)
  const endDate = new Date(year, mon, 0).toISOString().split('T')[0]
  const agentIds = targets.map(t => t.agent_id)

  const [{ data: monthDeals }, { data: monthLeads }] = await Promise.all([
    supabase
      .from('deals')
      .select('agent_id, unit_value, stage')
      .in('agent_id', agentIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabase
      .from('leads')
      .select('agent_id')
      .in('agent_id', agentIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
  ])

  const CONTRACTED = new Set(['Contracted', 'Registration', 'Handover'])

  const dealsMap = (monthDeals ?? []).reduce<Record<string, { revenue: number; count: number }>>((acc, d) => {
    if (!d.agent_id || !CONTRACTED.has(d.stage ?? '')) return acc
    if (!acc[d.agent_id]) acc[d.agent_id] = { revenue: 0, count: 0 }
    acc[d.agent_id].revenue += Number(d.unit_value ?? 0)
    acc[d.agent_id].count += 1
    return acc
  }, {})

  const leadsMap = (monthLeads ?? []).reduce<Record<string, number>>((acc, l) => {
    if (l.agent_id) acc[l.agent_id] = (acc[l.agent_id] ?? 0) + 1
    return acc
  }, {})

  return targets.map(t => {
    const profile = t.profiles as { full_name?: string } | null
    const { revenue = 0, count = 0 } = dealsMap[t.agent_id] ?? {}
    return {
      id: t.id,
      agent_id: t.agent_id,
      agent_name: profile?.full_name ?? 'وكيل',
      month: t.month,
      revenue_target: Number(t.revenue_target ?? 0),
      deals_target: Number(t.deals_target ?? 0),
      leads_target: Number(t.leads_target ?? 0),
      revenue_actual: revenue,
      deals_actual: count,
      leads_actual: leadsMap[t.agent_id] ?? 0,
    } satisfies AgentTarget
  })
}

export async function setTarget(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const payload = {
    agent_id: formData.get('agent_id') as string,
    month: formData.get('month') as string,
    revenue_target: parseFloat(formData.get('revenue_target') as string) || 0,
    deals_target: parseInt(formData.get('deals_target') as string) || 0,
    leads_target: parseInt(formData.get('leads_target') as string) || 0,
  }

  const { error } = await supabase
    .from('agent_targets')
    .upsert(payload, { onConflict: 'agent_id,month' })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/targets')
}
