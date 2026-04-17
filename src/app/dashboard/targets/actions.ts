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

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single()
  const companyId = profile?.company_id ?? user?.id

  const [year, mon] = month.split('-').map(Number)

  const { data: targets } = await supabase
    .from('targets')
    .select('*, profiles(full_name, company_id)')
    .eq('period_year', year)
    .eq('period_month', mon)
    .order('created_at', { ascending: false })

  // Filter to only targets belonging to agents in this company
  const companyTargets = (targets ?? []).filter(t => {
    const p = t.profiles as { full_name?: string; company_id?: string } | null
    return p?.company_id === companyId || t.agent_id === user?.id
  })

  if (!companyTargets.length) return []

  // Batch fetch actuals
  const startDate = `${month}-01`
  const endDate = new Date(year, mon, 0).toISOString().split('T')[0]
  const agentIds = companyTargets.map(t => t.agent_id)

  const [{ data: monthDeals }, { data: monthLeads }] = await Promise.all([
    supabase
      .from('deals')
      .select('agent_id, unit_value, amount, value, stage')
      .eq('company_id', companyId)
      .in('agent_id', agentIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabase
      .from('leads')
      .select('user_id')
      .eq('company_id', companyId)
      .in('user_id', agentIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
  ])

  const CONTRACTED = new Set(['Contracted', 'Registration', 'Handover', 'contract_signed'])

  const dealsMap = (monthDeals ?? []).reduce<Record<string, { revenue: number; count: number }>>((acc, d) => {
    if (!d.agent_id || !CONTRACTED.has(d.stage ?? '')) return acc
    if (!acc[d.agent_id]) acc[d.agent_id] = { revenue: 0, count: 0 }
    acc[d.agent_id].revenue += Number(d.unit_value ?? d.amount ?? d.value ?? 0)
    acc[d.agent_id].count += 1
    return acc
  }, {})

  const leadsMap = (monthLeads ?? []).reduce<Record<string, number>>((acc, l) => {
    if (l.user_id) acc[l.user_id] = (acc[l.user_id] ?? 0) + 1
    return acc
  }, {})

  return companyTargets.map(t => {
    const profile = t.profiles as { full_name?: string; company_id?: string } | null
    const { revenue = 0, count = 0 } = dealsMap[t.agent_id] ?? {}
    return {
      id: t.id,
      agent_id: t.agent_id,
      agent_name: profile?.full_name ?? 'وكيل',
      month: `${t.period_year}-${String(t.period_month).padStart(2, '0')}`,
      revenue_target: Number(t.revenue_target ?? t.target_revenue ?? 0),
      deals_target:   Number(t.deals_target   ?? t.target_deals   ?? 0),
      leads_target:   Number(t.leads_target   ?? 0),
      revenue_actual: revenue,
      deals_actual:   count,
      leads_actual:   leadsMap[t.agent_id] ?? 0,
    } satisfies AgentTarget
  })
}

export async function setTarget(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const monthStr = formData.get('month') as string
  const [year, mon] = monthStr.split('-').map(Number)

  const payload = {
    agent_id:       formData.get('agent_id') as string,
    period_year:    year,
    period_month:   mon,
    revenue_target: parseFloat(formData.get('revenue_target') as string) || 0,
    deals_target:   parseInt(formData.get('deals_target') as string) || 0,
    leads_target:   parseInt(formData.get('leads_target') as string) || 0,
    // also write to original columns for compatibility
    target_revenue: parseFloat(formData.get('revenue_target') as string) || 0,
    target_deals:   parseInt(formData.get('deals_target') as string) || 0,
  }

  const { error } = await supabase
    .from('targets')
    .upsert(payload, { onConflict: 'agent_id,period_year,period_month' })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/targets')
}
