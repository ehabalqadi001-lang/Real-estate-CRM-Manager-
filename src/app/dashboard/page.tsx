import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { FastInvestmentDashboard } from '@/components/dashboard/FastInvestmentDashboard'

export const dynamic = 'force-dynamic'

type LeadRow = { id: string; status: string | null; expected_value: number | null; created_at: string }
type DealRow = { id: string; stage: string | null; unit_value: number | null; amount: number | null; value: number | null; created_at: string }

export default async function DashboardRoot() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: leads },
    { data: deals },
    { data: pendingAds },
    { data: notifications },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, role, account_type').eq('id', user.id).maybeSingle(),
    supabase.from('leads').select('id, status, expected_value, created_at').limit(500),
    supabase.from('deals').select('id, stage, unit_value, amount, value, created_at').limit(500),
    supabase.from('ads').select('id').eq('status', 'pending').limit(200),
    supabase.from('notifications').select('id').eq('user_id', user.id).eq('is_read', false).limit(100),
  ])

  const safeLeads = (leads ?? []) as LeadRow[]
  const safeDeals = (deals ?? []) as DealRow[]
  const wonDeals = safeDeals.filter((deal) => ['Won', 'Contracted', 'Registration', 'Handover', 'contract_signed'].includes(deal.stage ?? ''))
  const revenue = wonDeals.reduce((sum, deal) => sum + Number(deal.unit_value ?? deal.amount ?? deal.value ?? 0), 0)
  const freshLeads = safeLeads.filter((lead) => ['new', 'fresh', 'Fresh Leads'].includes(lead.status ?? '')).length

  const chartData = buildChartData(safeLeads, safeDeals)

  return (
    <FastInvestmentDashboard
      metrics={{
        totalLeads: safeLeads.length,
        freshLeads,
        totalDeals: safeDeals.length,
        wonDeals: wonDeals.length,
        revenue,
        pendingAds: pendingAds?.length ?? 0,
        unreadNotifications: notifications?.length ?? 0,
        role: profile?.role ?? 'agent',
        name: profile?.full_name ?? user.email ?? 'FAST INVESTMENT',
      }}
      chartData={chartData}
    />
  )
}

function buildChartData(leads: LeadRow[], deals: DealRow[]) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now)
    date.setMonth(date.getMonth() - (5 - index))
    const month = date.getMonth()
    const year = date.getFullYear()

    const monthLeads = leads.filter((lead) => sameMonth(lead.created_at, month, year))
    const monthDeals = deals.filter((deal) => sameMonth(deal.created_at, month, year))
    const revenue = monthDeals.reduce((sum, deal) => sum + Number(deal.unit_value ?? deal.amount ?? deal.value ?? 0), 0)

    return {
      label: date.toLocaleDateString('ar-EG', { month: 'short' }),
      leads: monthLeads.length,
      deals: monthDeals.length,
      revenue,
    }
  })
}

function sameMonth(value: string, month: number, year: number) {
  const date = new Date(value)
  return date.getMonth() === month && date.getFullYear() === year
}
