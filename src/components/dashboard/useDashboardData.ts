'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/shared/supabase/browser'
import type { Commission, Database, Deal, Lead } from '@/lib/types/db'

export type DashboardRange = 'week' | 'month' | 'quarter' | 'year'

export type DashboardKpi = {
  totalClients: number
  clientsChange: number
  activeDeals: number
  pendingCommissions: number
  conversionRate: number
}

export type ChartPoint = {
  label: string
  sales: number
  clients: number
  cumulativeClients: number
  commissions: number
}

export type StagePoint = {
  stage: string
  count: number
  value: number
}

export type AiAlert = {
  id: string
  title: string
  body: string
  priority: 'critical' | 'high' | 'medium'
  actionLabel: string
  href: string
}

export type DashboardData = {
  kpis: DashboardKpi
  salesByMonth: ChartPoint[]
  clientGrowth: ChartPoint[]
  commissionsByMonth: ChartPoint[]
  dealsByStage: StagePoint[]
  alerts: AiAlert[]
  generatedAt: string
}

export type DashboardQueryContext = {
  userId: string
  companyId: string | null
}

const CLOSED_STAGES = new Set(['closed_won', 'closed_lost', 'closed', 'lost', 'Lost'])
const WON_STAGES = new Set(['closed_won', 'closed', 'Won', 'Contracted', 'contract_signed'])
const CONVERTED_LEAD_STATUSES = new Set(['Won', 'Contracted', 'converted', 'closed_won'])

const STAGE_LABELS: Record<string, string> = {
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

export const RANGE_LABELS: Record<DashboardRange, string> = {
  week: 'هذا الأسبوع',
  month: 'هذا الشهر',
  quarter: 'آخر 3 أشهر',
  year: 'هذه السنة',
}

export function useDashboardData(initialData: DashboardData, context: DashboardQueryContext) {
  const [range, setRange] = useState<DashboardRange>('month')
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  const refresh = useCallback(async (nextRange = range) => {
    setIsLoading(true)
    setError(null)

    try {
      const nextData = await fetchDashboardData(supabase, context, nextRange)
      setData(nextData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل بيانات لوحة القيادة')
    } finally {
      setIsLoading(false)
    }
  }, [context, range, supabase])

  useEffect(() => {
    if (range === 'month') return
    void refresh(range)
  }, [range, refresh])

  return {
    data,
    range,
    setRange,
    isLoading,
    error,
    refresh,
  }
}

export async function fetchDashboardData(
  supabase: SupabaseClient<Database>,
  context: DashboardQueryContext,
  range: DashboardRange,
): Promise<DashboardData> {
  const window = getRangeWindow(range)
  const previousWindow = getPreviousWindow(window.start, window.end)
  const sixMonthsStart = startOfMonth(addMonths(new Date(), -5))
  const yearStart = startOfYear(new Date())

  let leadsQuery = supabase
    .from('leads')
    .select('id, status, expected_value, budget, company_id, created_at')
    .gte('created_at', previousWindow.start.toISOString())
    .lte('created_at', window.end.toISOString())

  let dealsQuery = supabase
    .from('deals')
    .select('id, lead_id, stage, status, value, amount, unit_value, final_price, deal_date, contract_signed_at, expected_close_date, created_at, company_id')
    .gte('created_at', sixMonthsStart.toISOString())
    .lte('created_at', window.end.toISOString())

  let commissionsQuery = supabase
    .from('commissions')
    .select('id, status, amount, total_amount, expected_date, paid_at, created_at, company_id')
    .gte('created_at', yearStart.toISOString())
    .lte('created_at', window.end.toISOString())

  if (context.companyId) {
    leadsQuery = leadsQuery.eq('company_id', context.companyId)
    dealsQuery = dealsQuery.eq('company_id', context.companyId)
    commissionsQuery = commissionsQuery.eq('company_id', context.companyId)
  }

  const [leadsResult, dealsResult, commissionsResult] = await Promise.all([
    leadsQuery.limit(2000),
    dealsQuery.limit(2000),
    commissionsQuery.limit(2000),
  ])

  if (leadsResult.error) throw new Error(leadsResult.error.message)
  if (dealsResult.error) throw new Error(dealsResult.error.message)
  if (commissionsResult.error) throw new Error(commissionsResult.error.message)

  const leads = (leadsResult.data ?? []) as Lead[]
  const deals = (dealsResult.data ?? []) as Deal[]
  const commissions = (commissionsResult.data ?? []) as Commission[]

  return buildDashboardData(leads, deals, commissions, window, previousWindow)
}

export function buildDashboardData(
  leads: Lead[],
  deals: Deal[],
  commissions: Commission[],
  window: { start: Date; end: Date },
  previousWindow: { start: Date; end: Date },
): DashboardData {
  const leadsInRange = leads.filter((lead) => inRange(lead.created_at, window))
  const previousLeads = leads.filter((lead) => inRange(lead.created_at, previousWindow))
  const dealsInRange = deals.filter((deal) => inRange(deal.created_at, window))
  const commissionsInRange = commissions.filter((commission) => inRange(commission.created_at, window))

  const wonDeals = dealsInRange.filter((deal) => WON_STAGES.has(deal.stage ?? '') || deal.status === 'won')
  const convertedLeadIds = new Set(wonDeals.map((deal) => deal.lead_id).filter(Boolean))
  const convertedLeads = leadsInRange.filter((lead) => CONVERTED_LEAD_STATUSES.has(lead.status ?? '') || convertedLeadIds.has(lead.id))
  const activeDeals = dealsInRange.filter((deal) => !CLOSED_STAGES.has(deal.stage ?? '')).length
  const pendingCommissions = commissionsInRange
    .filter((commission) => commission.status === 'pending' || commission.status === 'approved')
    .reduce((sum, commission) => sum + getCommissionAmount(commission), 0)

  const monthly = buildMonthlyPoints(leads, deals, commissions)
  const dealsByStage = groupDealsByStage(dealsInRange)

  const kpis: DashboardKpi = {
    totalClients: leadsInRange.length,
    clientsChange: percentChange(leadsInRange.length, previousLeads.length),
    activeDeals,
    pendingCommissions,
    conversionRate: leadsInRange.length ? Math.round((convertedLeads.length / leadsInRange.length) * 100) : 0,
  }

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

export function getRangeWindow(range: DashboardRange) {
  const end = endOfDay(new Date())
  const now = new Date()

  if (range === 'week') return { start: startOfWeek(now), end }
  if (range === 'quarter') return { start: startOfDay(addMonths(now, -3)), end }
  if (range === 'year') return { start: startOfYear(now), end }
  return { start: startOfMonth(now), end }
}

function getPreviousWindow(start: Date, end: Date) {
  const duration = end.getTime() - start.getTime()
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start.getTime() - 1),
  }
}

function buildMonthlyPoints(leads: Lead[], deals: Deal[], commissions: Commission[]) {
  let cumulativeClients = 0

  return Array.from({ length: 6 }, (_, index) => {
    const date = startOfMonth(addMonths(new Date(), index - 5))
    const label = date.toLocaleDateString('ar-EG', { month: 'short' })
    const monthWindow = { start: date, end: endOfMonth(date) }
    const monthLeads = leads.filter((lead) => inRange(lead.created_at, monthWindow)).length
    const monthDeals = deals.filter((deal) => inRange(dealDate(deal), monthWindow))
    const monthCommissions = commissions.filter((commission) => inRange(commissionDate(commission), monthWindow))

    cumulativeClients += monthLeads

    return {
      label,
      sales: monthDeals
        .filter((deal) => WON_STAGES.has(deal.stage ?? '') || deal.status === 'won')
        .reduce((sum, deal) => sum + getDealValue(deal), 0),
      clients: monthLeads,
      cumulativeClients,
      commissions: monthCommissions
        .filter((commission) => commission.status === 'paid' || commission.status === 'approved')
        .reduce((sum, commission) => sum + getCommissionAmount(commission), 0),
    }
  })
}

function groupDealsByStage(deals: Deal[]) {
  const map = new Map<string, StagePoint>()

  for (const deal of deals) {
    const label = STAGE_LABELS[deal.stage ?? 'lead'] ?? 'غير محدد'
    const current = map.get(label) ?? { stage: label, count: 0, value: 0 }
    current.count += 1
    current.value += getDealValue(deal)
    map.set(label, current)
  }

  return ['جديد', 'تواصل', 'معاينة', 'عرض سعر', 'عقد', 'مغلقة', 'خسرنا']
    .map((stage) => map.get(stage) ?? { stage, count: 0, value: 0 })
}

function buildAiAlerts(kpis: DashboardKpi, stages: StagePoint[]): AiAlert[] {
  const offerValue = stages.find((stage) => stage.stage === 'عرض سعر')?.value ?? 0
  const contractCount = stages.find((stage) => stage.stage === 'عقد')?.count ?? 0

  const alerts: AiAlert[] = [
    {
      id: 'conversion',
      title: kpis.conversionRate < 8 ? 'معدل التحويل يحتاج متابعة' : 'معدل التحويل مستقر',
      body: kpis.conversionRate < 8
        ? 'راجع العملاء الجدد غير المتابعين واربطهم بمواعيد اتصال واضحة.'
        : 'استمر في دفع العملاء الأعلى نية إلى المعاينات والعقود.',
      priority: kpis.conversionRate < 8 ? 'critical' : 'medium',
      actionLabel: 'فتح العملاء',
      href: '/dashboard/leads',
    },
    {
      id: 'commissions',
      title: 'عمولات مستحقة للمراجعة',
      body: `${formatMoney(kpis.pendingCommissions)} في حالة مستحقة أو معتمدة ولم تغلق ماليا بعد.`,
      priority: kpis.pendingCommissions > 500000 ? 'high' : 'medium',
      actionLabel: 'مراجعة العمولات',
      href: '/dashboard/commissions',
    },
    {
      id: 'pipeline',
      title: 'فرص قريبة من الإغلاق',
      body: contractCount > 0
        ? `${contractCount.toLocaleString('ar-EG')} صفقة في مرحلة العقد تحتاج دفع سريع.`
        : `${formatMoney(offerValue)} في عروض السعر يمكن تحويلها بعروض دفع مناسبة.`,
      priority: contractCount > 0 ? 'high' : 'medium',
      actionLabel: 'فتح Pipeline',
      href: '/dashboard/pipeline',
    },
  ]

  return alerts.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)).slice(0, 3)
}

function priorityRank(priority: AiAlert['priority']) {
  return { critical: 0, high: 1, medium: 2 }[priority]
}

function getDealValue(deal: Deal) {
  return Number(deal.final_price ?? deal.unit_value ?? deal.amount ?? deal.value ?? 0)
}

function getCommissionAmount(commission: Commission) {
  return Number(commission.total_amount ?? commission.amount ?? 0)
}

function dealDate(deal: Deal) {
  return deal.contract_signed_at ?? deal.deal_date ?? deal.created_at
}

function commissionDate(commission: Commission) {
  return commission.paid_at ?? commission.expected_date ?? commission.created_at
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

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1)
}

function startOfWeek(date: Date) {
  const next = startOfDay(date)
  const day = next.getDay()
  const diff = day === 6 ? 0 : day + 1
  next.setDate(next.getDate() - diff)
  return next
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} ج.م`
}
