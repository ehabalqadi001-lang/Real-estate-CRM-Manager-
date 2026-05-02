import { getI18n } from '@/lib/i18n'
import { DollarSign, FileBarChart2, Target, TrendingUp, Users } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/require-role'
import ReportsCharts from './ReportsCharts'
import ExportReportsPdfButton from './ExportReportsPdfButton'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'التقارير | FAST INVESTMENT' }

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

const WON_STAGES = ['Contracted', 'Registration', 'Handover', 'Won', 'contract']

export default async function ReportsPage() {
  const { dir } = await getI18n()
  await requireAuth()
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user?.id
    ? await supabase.from('profiles').select('company_id, company_name').eq('id', user.id).maybeSingle()
    : { data: null }
  const targetCompanyId = profile?.company_id ?? user!.id

  const [{ data: leads }, { data: deals }, { data: profiles }] = await Promise.all([
    supabase
      .from('leads')
      .select('status, source, expected_value, created_at, agent_id')
      .eq('company_id', targetCompanyId),
    supabase
      .from('deals')
      .select('stage, unit_value, amount_paid, commission, created_at, agent_id')
      .eq('company_id', targetCompanyId),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', targetCompanyId),
  ])

  const safeLeads = leads ?? []
  const safeDeals = deals ?? []
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'وكيل']))

  const totalRevenue = safeDeals
    .filter((deal) => WON_STAGES.includes(deal.stage ?? ''))
    .reduce((sum, deal) => sum + Number(deal.unit_value ?? 0), 0)
  const totalCommissions = safeDeals.reduce((sum, deal) => sum + Number(deal.commission ?? 0), 0)
  const totalCollected = safeDeals.reduce((sum, deal) => sum + Number(deal.amount_paid ?? 0), 0)
  const conversion = safeLeads.length
    ? Math.round((safeLeads.filter((lead) => lead.status === 'Won').length / safeLeads.length) * 100)
    : 0

  const now = new Date()
  const monthlyTrend = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now)
    date.setMonth(date.getMonth() - (11 - index))
    const label = date.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' })
    const monthDeals = safeDeals.filter((deal) => {
      const createdAt = new Date(deal.created_at)
      return createdAt.getMonth() === date.getMonth() && createdAt.getFullYear() === date.getFullYear()
    })
    const revenue = monthDeals
      .filter((deal) => WON_STAGES.includes(deal.stage ?? ''))
      .reduce((sum, deal) => sum + Number(deal.unit_value ?? 0), 0)
    return { month: label, revenue, deals: monthDeals.length }
  })

  const stageCounts: Record<string, number> = {}
  safeDeals.forEach((deal) => {
    const stage = deal.stage ?? 'جديد'
    stageCounts[stage] = (stageCounts[stage] ?? 0) + 1
  })
  const stageData = Object.entries(stageCounts).map(([name, value]) => ({ name, value }))

  const agentMap: Record<string, { deals: number; revenue: number }> = {}
  safeDeals.forEach((deal) => {
    if (!deal.agent_id) return
    const name = profileMap.get(deal.agent_id) ?? 'وكيل'
    if (!agentMap[name]) agentMap[name] = { deals: 0, revenue: 0 }
    agentMap[name].deals += 1
    agentMap[name].revenue += Number(deal.unit_value ?? 0)
  })
  const agentData = Object.entries(agentMap)
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  const { data: dealsFull } = await supabase
    .from('deals')
    .select('unit_value, stage, developer:developers(name)')
    .eq('company_id', targetCompanyId)
    .in('stage', WON_STAGES)

  const devMap: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(dealsFull ?? []).forEach((deal: any) => {
    const developerName: string = Array.isArray(deal.developer)
      ? (deal.developer[0]?.name ?? 'غير محدد')
      : (deal.developer?.name ?? 'غير محدد')
    devMap[developerName] = (devMap[developerName] ?? 0) + Number(deal.unit_value ?? 0)
  })
  const sortedDevs = Object.entries(devMap).sort((a, b) => b[1] - a[1])
  const maxDevSales = sortedDevs[0]?.[1] ?? 1

  const kpis = [
    { label: 'إجمالي الإيرادات', value: `${fmt(totalRevenue)} ج.م`, icon: DollarSign, color: 'text-[var(--fi-emerald)]', bg: 'bg-[var(--fi-soft)]' },
    { label: 'إجمالي التحصيلات', value: `${fmt(totalCollected)} ج.م`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'إجمالي العملاء', value: `${safeLeads.length}`, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'معدل التحويل', value: `${conversion}%`, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'صافي العمولات', value: `${fmt(totalCommissions)} ج.م`, icon: FileBarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'إجمالي الصفقات', value: `${safeDeals.length}`, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ]

  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <FileBarChart2 size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">التقارير والتحليلات</h1>
            <p className="text-xs text-[var(--fi-muted)]">أداء المبيعات، الإيرادات، الوكلاء، والمطورين</p>
          </div>
        </div>
        <ExportReportsPdfButton fileName={`fast-investment-${new Date().toISOString().slice(0, 10)}.pdf`} />
      </div>

      <section data-report-export className="space-y-5">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
                <div className={`${kpi.bg} flex size-10 shrink-0 items-center justify-center rounded-lg`}>
                  <Icon size={18} className={kpi.color} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--fi-muted)]">{kpi.label}</p>
                  <p className={`fi-tabular truncate text-base font-black leading-tight ${kpi.color}`}>{kpi.value}</p>
                </div>
              </div>
            )
          })}
        </div>

        <ReportsCharts monthlyTrend={monthlyTrend} stageData={stageData} agentData={agentData} />

        {sortedDevs.length > 0 && (
          <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
            <h2 className="mb-5 text-sm font-black text-[var(--fi-ink)]">تقرير أداء المطورين العقاريين</h2>
            <div className="space-y-4">
              {sortedDevs.map(([developerName, sales]) => {
                const percentage = (sales / maxDevSales) * 100
                return (
                  <div key={developerName}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className={`text-sm font-bold ${developerName === 'غير محدد' ? 'text-red-500' : 'text-[var(--fi-ink)]'}`}>
                        {developerName}
                      </span>
                      <span className="fi-tabular text-sm font-black text-[var(--fi-emerald)]">{fmt(sales)} ج.م</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        // eslint-disable-next-line no-inline-styles/no-inline-styles
                        style={{ width: `${percentage}%`, background: developerName === 'غير محدد' ? '#EF4444' : 'var(--fi-gradient-primary)' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {sortedDevs.some(([name]) => name === 'غير محدد') && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                تنبيه: بعض الصفقات غير مرتبطة بمطور. يرجى تعديلها لضمان دقة التقارير.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
