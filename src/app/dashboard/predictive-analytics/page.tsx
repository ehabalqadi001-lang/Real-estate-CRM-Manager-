import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { TrendingUp, BarChart3, Target, Zap } from 'lucide-react'
import { PredictiveClient } from './PredictiveClient'

export const dynamic = 'force-dynamic'

export default async function PredictiveAnalyticsPage() {
  await requirePermission('report.view.own')
  const { profile } = await requireSession()
  const supabase = await createRawClient()
  const companyId = profile.company_id ?? profile.id

  const [{ data: dealsRaw }, { data: leadsRaw }] = await Promise.all([
    supabase
      .from('deals')
      .select('id, amount, status, created_at, location')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
      .limit(500),
    supabase
      .from('leads')
      .select('id, status, score, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
      .limit(500),
  ])

  const deals = (dealsRaw ?? []) as {
    id: string; amount: number | null; status: string | null; created_at: string; location: string | null
  }[]
  const leads = (leadsRaw ?? []) as {
    id: string; status: string | null; score: number | null; created_at: string
  }[]

  // Build monthly data (last 6 months + 3 forecast months)
  const now = new Date()
  const monthlyMap: Record<string, { deals: number; revenue: number; leads: number; forecast?: number }> = {}

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' })
    monthlyMap[key] = { deals: 0, revenue: 0, leads: 0 }
  }

  deals.forEach(d => {
    if (!d.created_at) return
    const key = new Date(d.created_at).toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' })
    if (monthlyMap[key]) {
      monthlyMap[key].deals++
      monthlyMap[key].revenue += Number(d.amount ?? 0)
    }
  })

  leads.forEach(l => {
    if (!l.created_at) return
    const key = new Date(l.created_at).toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' })
    if (monthlyMap[key]) monthlyMap[key].leads++
  })

  const monthlyData = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }))

  // Add 3-month forecast (simple linear extrapolation)
  const last3Deals = monthlyData.slice(-3).map(m => m.deals)
  const avgGrowth  = last3Deals.length >= 2 ? (last3Deals[last3Deals.length - 1] - last3Deals[0]) / Math.max(last3Deals.length - 1, 1) : 0
  const lastDeals  = last3Deals[last3Deals.length - 1] ?? 0

  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const key = d.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' })
    monthlyData.push({ month: key, deals: 0, revenue: 0, leads: 0, forecast: Math.max(0, Math.round(lastDeals + avgGrowth * i)) })
  }

  // KPIs
  const wonDeals    = deals.filter(d => d.status === 'won')
  const totalDeals  = wonDeals.length
  const avgDealValue = totalDeals > 0 ? Math.round(wonDeals.reduce((s, d) => s + Number(d.amount ?? 0), 0) / totalDeals) : 0
  const conversionRate = leads.length > 0 ? Math.round((totalDeals / leads.length) * 100) : 0

  // Lead funnel
  const stageMap: Record<string, number> = {
    'جديد': 0, 'تم التواصل': 0, 'مهتم': 0, 'عرض سعر': 0, 'مفاوضات': 0, 'صفقة محتملة': 0,
  }
  leads.forEach(l => {
    const s = l.status ?? 'جديد'
    stageMap[s] = (stageMap[s] ?? 0) + 1
  })
  const leadFunnel = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }))

  // Top regions
  const regionMap: Record<string, { deals: number; revenue: number }> = {}
  deals.forEach(d => {
    const r = d.location ?? 'غير محدد'
    regionMap[r] = regionMap[r] ?? { deals: 0, revenue: 0 }
    regionMap[r].deals++
    regionMap[r].revenue += Number(d.amount ?? 0)
  })
  const topRegions = Object.entries(regionMap)
    .map(([region, v]) => ({ region, ...v }))
    .sort((a, b) => b.deals - a.deals)
    .slice(0, 8)

  const topRegion = topRegions[0]?.region ?? 'غير محدد'

  // Month-over-month trend
  const mLen = monthlyData.filter(m => m.deals > 0 || m.forecast === undefined)
  const prevMonth = mLen[mLen.length - 2]?.deals ?? 0
  const currMonth = mLen[mLen.length - 1]?.deals ?? 0
  const trend = prevMonth > 0 ? Math.round(((currMonth - prevMonth) / prevMonth) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[#0F8F83]">NEXUS Foresight Engine</p>
        <h1 className="mt-1 text-xl sm:text-3xl font-black text-[#102033] dark:text-white">التحليلات التنبؤية</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          توقعات المبيعات، قمع العملاء المحتملين، وأداء المناطق — مدعومة بالذكاء الاصطناعي.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: <BarChart3 className="size-5" />, value: totalDeals,                               label: 'صفقات مغلقة',     color: 'text-[#0F8F83]' },
          { icon: <TrendingUp className="size-5" />, value: `${avgDealValue.toLocaleString('ar-EG')} ج.م`, label: 'متوسط الصفقة', color: 'text-[#C9964A]' },
          { icon: <Target className="size-5" />,    value: `${conversionRate}%`,                    label: 'معدل التحويل',    color: 'text-purple-600' },
          { icon: <Zap className="size-5" />,       value: leads.length,                            label: 'عملاء محتملون',   color: 'text-blue-500' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className={`mb-2 ${k.color}`}>{k.icon}</div>
            <p className="text-xl font-black text-[#102033] dark:text-white">{k.value}</p>
            <p className="text-xs font-semibold text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <PredictiveClient
        monthlyData={monthlyData}
        leadFunnel={leadFunnel}
        topRegions={topRegions}
        totalDeals={totalDeals}
        avgDealValue={avgDealValue}
        conversionRate={conversionRate}
        topRegion={topRegion}
        trend={trend}
      />
    </div>
  )
}
