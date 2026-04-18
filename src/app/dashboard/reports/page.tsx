import { FileBarChart2, TrendingUp, Users, Target, DollarSign, Download } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/require-role'
import ReportsCharts from './ReportsCharts'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'التقارير | FAST INVESTMENT' }

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export default async function ReportsPage() {
  await requireAuth()
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: leads }, { data: deals }, { data: profiles }] = await Promise.all([
    supabase
      .from('leads')
      .select('status, source, expected_value, created_at, agent_id')
      .eq('company_id', user?.id),
    supabase
      .from('deals')
      .select('stage, unit_value, amount_paid, commission, created_at, agent_id')
      .eq('company_id', user?.id),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', user?.id),
  ])

  const safeLeads = leads ?? []
  const safeDeals = deals ?? []
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.full_name ?? 'وكيل']))

  // KPIs
  const totalRevenue = safeDeals
    .filter(d => ['Contracted', 'Registration', 'Handover', 'Won'].includes(d.stage ?? ''))
    .reduce((s, d) => s + Number(d.unit_value ?? 0), 0)
  const totalCommissions = safeDeals.reduce((s, d) => s + Number(d.commission ?? 0), 0)
  const totalCollected   = safeDeals.reduce((s, d) => s + Number(d.amount_paid ?? 0), 0)
  const conversion = safeLeads.length
    ? Math.round((safeLeads.filter(l => l.status === 'Won').length / safeLeads.length) * 100)
    : 0

  // Monthly trend (last 12 months)
  const now = new Date()
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - (11 - i))
    const label = d.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' })
    const monthDeals = safeDeals.filter(dl => {
      const dd = new Date(dl.created_at)
      return dd.getMonth() === d.getMonth() && dd.getFullYear() === d.getFullYear()
    })
    const revenue = monthDeals
      .filter(dl => ['Contracted', 'Registration', 'Handover', 'Won'].includes(dl.stage ?? ''))
      .reduce((s, dl) => s + Number(dl.unit_value ?? 0), 0)
    return { month: label, revenue, deals: monthDeals.length }
  })

  // Deals by stage
  const stageCounts: Record<string, number> = {}
  safeDeals.forEach(d => { const s = d.stage ?? 'New'; stageCounts[s] = (stageCounts[s] ?? 0) + 1 })
  const stageData = Object.entries(stageCounts).map(([name, value]) => ({ name, value }))

  // Agent leaderboard
  const agentMap: Record<string, { deals: number; revenue: number }> = {}
  safeDeals.forEach(d => {
    if (!d.agent_id) return
    const name = profileMap.get(d.agent_id) ?? 'وكيل'
    if (!agentMap[name]) agentMap[name] = { deals: 0, revenue: 0 }
    agentMap[name].deals++
    agentMap[name].revenue += Number(d.unit_value ?? 0)
  })
  const agentData = Object.entries(agentMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  // Developer performance
  const { data: dealsFull } = await supabase
    .from('deals')
    .select('unit_value, stage, developer:developers(name)')
    .eq('company_id', user?.id)
    .in('stage', ['Contracted', 'Registration', 'Handover', 'Won'])

  const devMap: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(dealsFull ?? []).forEach((d: any) => {
    const devName: string = Array.isArray(d.developer)
      ? (d.developer[0]?.name ?? 'غير محدد')
      : (d.developer?.name ?? 'غير محدد')
    devMap[devName] = (devMap[devName] ?? 0) + Number(d.unit_value ?? 0)
  })
  const sortedDevs = Object.entries(devMap).sort((a, b) => b[1] - a[1])
  const maxDevSales = sortedDevs[0]?.[1] ?? 1

  const kpis = [
    { label: 'إجمالي الإيرادات',  value: `${fmt(totalRevenue)} ج.م`,    icon: DollarSign,  color: 'text-[var(--fi-emerald)]',  bg: 'bg-[var(--fi-soft)]' },
    { label: 'إجمالي التحصيلات', value: `${fmt(totalCollected)} ج.م`,   icon: TrendingUp,  color: 'text-blue-600',             bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'إجمالي العملاء',   value: `${safeLeads.length}`,           icon: Users,       color: 'text-purple-600',           bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'معدل التحويل',      value: `${conversion}%`,               icon: Target,      color: 'text-amber-600',            bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'صافي العمولات',    value: `${fmt(totalCommissions)} ج.م`, icon: FileBarChart2, color: 'text-indigo-600',          bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'إجمالي الصفقات',   value: `${safeDeals.length}`,           icon: Target,      color: 'text-rose-600',             bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ]

  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <FileBarChart2 size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">التقارير والتحليلات</h1>
            <p className="text-xs text-[var(--fi-muted)]">أداء المبيعات · الإيرادات · الوكلاء · المطورون</p>
          </div>
        </div>
        <button
          type="button"
          onClick={undefined}
          className="flex items-center gap-2 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2.5 text-sm font-bold text-[var(--fi-ink)] transition hover:opacity-80"
          aria-label="تصدير التقرير"
        >
          <Download size={14} aria-hidden="true" /> تصدير PDF
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="flex items-center gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
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

      {/* Charts */}
      <ReportsCharts monthlyTrend={monthlyTrend} stageData={stageData} agentData={agentData} />

      {/* Developer Performance */}
      {sortedDevs.length > 0 && (
        <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <h2 className="mb-5 text-sm font-black text-[var(--fi-ink)]">تقرير أداء المطورين العقاريين</h2>
          <div className="space-y-4">
            {sortedDevs.map(([devName, sales]) => {
              const pct = (sales / maxDevSales) * 100
              return (
                <div key={devName}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={`text-sm font-bold ${devName === 'غير محدد' ? 'text-red-500' : 'text-[var(--fi-ink)]'}`}>
                      {devName}
                    </span>
                    <span className="fi-tabular text-sm font-black text-[var(--fi-emerald)]">{fmt(sales)} ج.م</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: devName === 'غير محدد' ? '#EF4444' : 'var(--fi-gradient-primary)' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {sortedDevs.some(([n]) => n === 'غير محدد') && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
              تنبيه: بعض الصفقات غير مرتبطة بمطور. يرجى تعديلها لضمان دقة التقارير.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
