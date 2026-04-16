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

  // Enrich with actuals from deals/leads this month
  const startDate = `${month}-01`
  const [year, mon] = month.split('-').map(Number)
  const endDate = new Date(year, mon, 0).toISOString().split('T')[0]

  return Promise.all(targets.map(async (t) => {
    const { data: deals } = await supabase
      .from('deals')
      .select('unit_value, stage')
      .eq('agent_id', t.agent_id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const { count: leadsCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', t.agent_id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const contractedDeals = (deals ?? []).filter(d =>
      ['Contracted', 'Registration', 'Handover'].includes(d.stage ?? '')
    )
    const profile = t.profiles as { full_name?: string } | null

    return {
      id: t.id,
      agent_id: t.agent_id,
      agent_name: profile?.full_name ?? 'وكيل',
      month: t.month,
      revenue_target: Number(t.revenue_target ?? 0),
      deals_target: Number(t.deals_target ?? 0),
      leads_target: Number(t.leads_target ?? 0),
      revenue_actual: contractedDeals.reduce((s, d) => s + Number(d.unit_value ?? 0), 0),
      deals_actual: contractedDeals.length,
      leads_actual: leadsCount ?? 0,
    } satisfies AgentTarget
  }))
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
