import { ActivityFeed, type ActivityFeedItem } from '@/components/dashboard/ActivityFeed'
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs'
import type { DashboardData, DashboardKpi, StagePoint } from '@/components/dashboard/useDashboardData'
import type { AuditLog, Commission, Deal, Lead, Profile } from '@/lib/types/db'
import { requireSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardRoot() {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()
  const companyId = session.profile.company_id ?? session.user.id

  const [dashboardData, activities] = await Promise.all([
    getDashboardData(supabase, companyId),
    getActivityFeed(supabase),
  ])

  return (
    <main className="space-y-4 px-3 py-4 sm:px-4 lg:px-6" dir="rtl">
      <DashboardKPIs
        initialData={dashboardData}
        context={{ userId: session.user.id, companyId }}
      />
      <ActivityFeed initialActivities={activities} />
    </main>
  )
}

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>

async function getDashboardData(supabase: ServerSupabase, companyId: string | null): Promise<DashboardData> {
  const now = new Date()
  const range = { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) }
  const previous = { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)) }
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  let leadsQuery = supabase
    .from('leads')
    .select('id, status, expected_value, budget, company_id, created_at')
    .gte('created_at', previous.start.toISOString())
    .lte('created_at', range.end.toISOString())
    .limit(2000)

  let dealsQuery = supabase
    .from('deals')
    .select('id, lead_id, stage, status, value, amount, unit_value, final_price, deal_date, contract_signed_at, expected_close_date, created_at, company_id')
    .gte('created_at', sixMonthsStart.toISOString())
    .lte('created_at', range.end.toISOString())
    .limit(2000)

  let commissionsQuery = supabase
    .from('commissions')
    .select('id, status, amount, total_amount, expected_date, paid_at, created_at, company_id')
    .gte('created_at', yearStart.toISOString())
    .lte('created_at', range.end.toISOString())
    .limit(2000)

  if (companyId) {
    leadsQuery = leadsQuery.eq('company_id', companyId)
    dealsQuery = dealsQuery.eq('company_id', companyId)
    commissionsQuery = commissionsQuery.eq('company_id', companyId)
  }

  const [leadsResult, dealsResult, commissionsResult] = await Promise.all([leadsQuery, dealsQuery, commissionsQuery])

  const leads = (leadsResult.data ?? []) as unknown as Lead[]
  const deals = (dealsResult.data ?? []) as unknown as Deal[]
  const commissions = (commissionsResult.data ?? []) as unknown as Commission[]
  const leadsInRange = leads.filter((lead) => inRange(lead.created_at, range))
  const previousLeads = leads.filter((lead) => inRange(lead.created_at, previous))
  const dealsInRange = deals.filter((deal) => inRange(deal.created_at, range))
  const commissionsInRange = commissions.filter((commission) => inRange(commission.created_at, range))
  const convertedLeadIds = new Set(dealsInRange.filter(isWonDeal).map((deal) => deal.lead_id).filter(Boolean))
  const convertedLeads = leadsInRange.filter((lead) => ['Won', 'Contracted', 'converted', 'closed_won'].includes(lead.status ?? '') || convertedLeadIds.has(lead.id))

  const kpis: DashboardKpi = {
    totalClients: leadsInRange.length,
    clientsChange: percentChange(leadsInRange.length, previousLeads.length),
    activeDeals: dealsInRange.filter((deal) => !['closed_won', 'closed_lost', 'closed', 'lost', 'Lost'].includes(deal.stage ?? '')).length,
    pendingCommissions: commissionsInRange
      .filter((commission) => commission.status === 'pending' || commission.status === 'approved')
      .reduce((sum, commission) => sum + Number(commission.total_amount ?? commission.amount ?? 0), 0),
    conversionRate: leadsInRange.length ? Math.round((convertedLeads.length / leadsInRange.length) * 100) : 0,
  }

  const monthly = buildMonthlyPoints(leads, deals, commissions)
  const dealsByStage = groupDealsByStage(dealsInRange)

  return {
    kpis,
    salesByMonth: monthly,
    clientGrowth: monthly,
    commissionsByMonth: monthly,
    dealsByStage,
    alerts: buildAiAlerts(kpis, dealsByStage),
    generatedAt: new Date().toISOString(),
  }
}

async function getActivityFeed(supabase: ServerSupabase): Promise<ActivityFeedItem[]> {
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, user_id, action, target_table, target_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(15)

  const safeLogs = (logs ?? []) as unknown as AuditLog[]
  const userIds = Array.from(new Set(safeLogs.map((log) => log.user_id).filter(Boolean))) as string[]
  let names = new Map<string, string | null>()

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    names = new Map(((profiles ?? []) as unknown as Pick<Profile, 'id' | 'full_name'>[]).map((profile) => [profile.id, profile.full_name]))
  }

  return safeLogs.map((log) => ({
    id: log.id,
    action: log.action,
    targetTable: log.target_table,
    agentName: (log.user_id ? names.get(log.user_id) : null) || 'عضو فريق',
    createdAt: log.created_at,
  }))
}

function buildMonthlyPoints(leads: Lead[], deals: Deal[], commissions: Commission[]) {
  let cumulativeClients = 0
  const now = new Date()

  return Array.from({ length: 6 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() + index - 5, 1)
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth() + 1, 0))
    const monthRange = { start, end }
    const monthLeads = leads.filter((lead) => inRange(lead.created_at, monthRange)).length
    cumulativeClients += monthLeads

    return {
      label: start.toLocaleDateString('ar-EG', { month: 'short' }),
      sales: deals
        .filter((deal) => inRange(deal.contract_signed_at ?? deal.deal_date ?? deal.created_at, monthRange) && isWonDeal(deal))
        .reduce((sum, deal) => sum + dealValue(deal), 0),
      clients: monthLeads,
      cumulativeClients,
      commissions: commissions
        .filter((commission) => inRange(commission.paid_at ?? commission.expected_date ?? commission.created_at, monthRange))
        .filter((commission) => commission.status === 'paid' || commission.status === 'approved')
        .reduce((sum, commission) => sum + Number(commission.total_amount ?? commission.amount ?? 0), 0),
    }
  })
}

function groupDealsByStage(deals: Deal[]): StagePoint[] {
  const labels: Record<string, string> = {
    lead: 'جديد',
    new: 'جديد',
    qualified: 'تواصل',
    contacted: 'تواصل',
    site_visit: 'معاينة',
    viewing: 'معاينة',
    proposal: 'عرض سعر',
    offer: 'عرض سعر',
    negotiation: 'عرض سعر',
    reservation: 'عقد',
    contract: 'عقد',
    Contracted: 'عقد',
    closed_won: 'مغلقة',
    closed: 'مغلقة',
    closed_lost: 'خسرنا',
    lost: 'خسرنا',
    Lost: 'خسرنا',
  }
  const map = new Map<string, StagePoint>()

  for (const deal of deals) {
    const stage = labels[deal.stage ?? 'lead'] ?? 'غير محدد'
    const current = map.get(stage) ?? { stage, count: 0, value: 0 }
    current.count += 1
    current.value += dealValue(deal)
    map.set(stage, current)
  }

  return ['جديد', 'تواصل', 'معاينة', 'عرض سعر', 'عقد', 'مغلقة', 'خسرنا'].map((stage) => map.get(stage) ?? { stage, count: 0, value: 0 })
}

function buildAiAlerts(kpis: DashboardKpi, stages: StagePoint[]) {
  const contractCount = stages.find((stage) => stage.stage === 'عقد')?.count ?? 0
  return [
    {
      id: 'conversion',
      title: kpis.conversionRate < 8 ? 'معدل التحويل يحتاج متابعة' : 'معدل التحويل مستقر',
      body: kpis.conversionRate < 8 ? 'راجع العملاء الجدد غير المتابعين واربطهم بمواعيد اتصال واضحة.' : 'استمر في دفع العملاء الأعلى نية إلى المعاينات والعقود.',
      priority: kpis.conversionRate < 8 ? 'critical' as const : 'medium' as const,
      actionLabel: 'فتح العملاء',
      href: '/dashboard/leads',
    },
    {
      id: 'commissions',
      title: 'عمولات مستحقة للمراجعة',
      body: `${new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(kpis.pendingCommissions)} ج.م في حالة مستحقة أو معتمدة.`,
      priority: kpis.pendingCommissions > 500000 ? 'high' as const : 'medium' as const,
      actionLabel: 'مراجعة العمولات',
      href: '/dashboard/commissions',
    },
    {
      id: 'pipeline',
      title: 'فرص قريبة من الإغلاق',
      body: contractCount > 0 ? `${contractCount.toLocaleString('ar-EG')} صفقة في مرحلة العقد تحتاج دفع سريع.` : 'راجع عروض السعر المفتوحة لتحويلها إلى عقود.',
      priority: contractCount > 0 ? 'high' as const : 'medium' as const,
      actionLabel: 'فتح Pipeline',
      href: '/dashboard/pipeline',
    },
  ]
}

function isWonDeal(deal: Deal) {
  return ['closed_won', 'closed', 'Won', 'Contracted', 'contract_signed'].includes(deal.stage ?? '') || deal.status === 'won'
}

function dealValue(deal: Deal) {
  return Number(deal.final_price ?? deal.unit_value ?? deal.amount ?? deal.value ?? 0)
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function inRange(value: string | null | undefined, range: { start: Date; end: Date }) {
  if (!value) return false
  const time = new Date(value).getTime()
  return time >= range.start.getTime() && time <= range.end.getTime()
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}
