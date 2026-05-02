import { ActivityFeed, type ActivityFeedItem } from '@/components/dashboard/ActivityFeed'
import { BentoDashboardLayout } from '@/components/dashboard/BentoDashboardLayout'
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs'
import type { DashboardData, DashboardKpi, StagePoint } from '@/components/dashboard/useDashboardData'
import { getI18n } from '@/lib/i18n'
import type { AuditLog, Commission, Deal, Lead, Profile } from '@/lib/types/db'
import { requireSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardRoot() {
  const { t, numLocale } = await getI18n()
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()
  const companyId = session.profile.company_id ?? session.user.id

  const [dashboardData, activities] = await Promise.all([
    getDashboardData(supabase, companyId, t, numLocale),
    getActivityFeed(supabase, t),
  ])

  return (
    <main className="space-y-4 px-3 py-4 sm:px-4 lg:px-6">
      <BentoDashboardLayout
        main={(
          <DashboardKPIs
            initialData={dashboardData}
            context={{ userId: session.user.id, companyId }}
          />
        )}
        sidebar={<ActivityFeed initialActivities={activities} />}
      />
    </main>
  )
}

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>
type TFn = (ar: string, en: string) => string

async function getDashboardData(supabase: ServerSupabase, companyId: string | null, t: TFn, numLocale: string): Promise<DashboardData> {
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

  const monthly = buildMonthlyPoints(leads, deals, commissions, numLocale)
  const dealsByStage = groupDealsByStage(dealsInRange, t)

  return {
    kpis,
    salesByMonth: monthly,
    clientGrowth: monthly,
    commissionsByMonth: monthly,
    dealsByStage,
    alerts: buildAiAlerts(kpis, dealsByStage, t, numLocale),
    generatedAt: new Date().toISOString(),
  }
}

async function getActivityFeed(supabase: ServerSupabase, t: TFn): Promise<ActivityFeedItem[]> {
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
    agentName: (log.user_id ? names.get(log.user_id) : null) || t('عضو فريق', 'Team Member'),
    createdAt: log.created_at,
  }))
}

function buildMonthlyPoints(leads: Lead[], deals: Deal[], commissions: Commission[], numLocale: string) {
  let cumulativeClients = 0
  const now = new Date()

  return Array.from({ length: 6 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() + index - 5, 1)
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth() + 1, 0))
    const monthRange = { start, end }
    const monthLeads = leads.filter((lead) => inRange(lead.created_at, monthRange)).length
    cumulativeClients += monthLeads

    return {
      label: start.toLocaleDateString(numLocale, { month: 'short' }),
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

function groupDealsByStage(deals: Deal[], t: TFn): StagePoint[] {
  const s_new   = t('جديد', 'New')
  const s_cont  = t('تواصل', 'Contacted')
  const s_view  = t('معاينة', 'Viewing')
  const s_offer = t('عرض سعر', 'Offer')
  const s_ctrct = t('عقد', 'Contract')
  const s_won   = t('مغلقة', 'Closed')
  const s_lost  = t('خسرنا', 'Lost')
  const labels: Record<string, string> = {
    lead: s_new, new: s_new,
    qualified: s_cont, contacted: s_cont,
    site_visit: s_view, viewing: s_view,
    proposal: s_offer, offer: s_offer, negotiation: s_offer,
    reservation: s_ctrct, contract: s_ctrct, Contracted: s_ctrct,
    closed_won: s_won, closed: s_won,
    closed_lost: s_lost, lost: s_lost, Lost: s_lost,
  }
  const map = new Map<string, StagePoint>()

  for (const deal of deals) {
    const stage = labels[deal.stage ?? 'lead'] ?? t('غير محدد', 'Other')
    const current = map.get(stage) ?? { stage, count: 0, value: 0 }
    current.count += 1
    current.value += dealValue(deal)
    map.set(stage, current)
  }

  return [s_new, s_cont, s_view, s_offer, s_ctrct, s_won, s_lost].map((stage) => map.get(stage) ?? { stage, count: 0, value: 0 })
}

function buildAiAlerts(kpis: DashboardKpi, stages: StagePoint[], t: TFn, numLocale: string) {
  const contractStageLabel = t('عقد', 'Contract')
  const contractCount = stages.find((stage) => stage.stage === contractStageLabel)?.count ?? 0
  return [
    {
      id: 'conversion',
      title: kpis.conversionRate < 8 ? t('معدل التحويل يحتاج متابعة', 'Conversion rate needs attention') : t('معدل التحويل مستقر', 'Conversion rate is stable'),
      body: kpis.conversionRate < 8 ? t('راجع العملاء الجدد غير المتابعين واربطهم بمواعيد اتصال واضحة.', 'Review new uncontacted leads and schedule clear follow-up calls.') : t('استمر في دفع العملاء الأعلى نية إلى المعاينات والعقود.', 'Keep pushing high-intent leads toward viewings and contracts.'),
      priority: kpis.conversionRate < 8 ? 'critical' as const : 'medium' as const,
      actionLabel: t('فتح العملاء', 'Open Leads'),
      href: '/dashboard/leads',
    },
    {
      id: 'commissions',
      title: t('عمولات مستحقة للمراجعة', 'Commissions pending review'),
      body: `${new Intl.NumberFormat(numLocale, { notation: 'compact', maximumFractionDigits: 1 }).format(kpis.pendingCommissions)} ${t('ج.م', 'EGP')} ${t('في حالة مستحقة أو معتمدة.', 'in pending or approved status.')}`,
      priority: kpis.pendingCommissions > 500000 ? 'high' as const : 'medium' as const,
      actionLabel: t('مراجعة العمولات', 'Review Commissions'),
      href: '/dashboard/commissions',
    },
    {
      id: 'pipeline',
      title: t('فرص قريبة من الإغلاق', 'Deals close to closing'),
      body: contractCount > 0 ? `${contractCount.toLocaleString(numLocale)} ${t('صفقة في مرحلة العقد تحتاج دفع سريع.', 'deals in contract stage need a quick push.')}` : t('راجع عروض السعر المفتوحة لتحويلها إلى عقود.', 'Review open offers to convert them into contracts.'),
      priority: contractCount > 0 ? 'high' as const : 'medium' as const,
      actionLabel: t('فتح Pipeline', 'Open Pipeline'),
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
