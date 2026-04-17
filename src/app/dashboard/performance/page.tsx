import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react'
import { requireAdmin } from '@/lib/require-role'
import PerformanceChart from './PerformanceChart'

export const dynamic = 'force-dynamic'

interface AgentStats {
  id: string
  full_name: string
  leads: number
  deals: number
  revenue: number
  conversion: number
}

export default async function PerformancePage() {
  await requireAdmin()

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single()
  const targetCompanyId = profile?.company_id || user?.id

  // جلب بيانات الوكلاء مع إحصائياتهم — single batch query replaces N+1 loop
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'agent')
    .eq('company_id', targetCompanyId)

  // Batch fetch — 2 queries total instead of 2N
  const agentIds = (agents ?? []).map(a => a.id)

  const [{ data: allLeads }, { data: allDeals }] = await Promise.all([
    supabase.from('leads').select('user_id').eq('company_id', targetCompanyId).in('user_id', agentIds),
    supabase.from('deals').select('agent_id, unit_value, amount, value').eq('company_id', targetCompanyId).in('agent_id', agentIds),
  ])

  const leadsMap = (allLeads ?? []).reduce<Record<string, number>>((acc, l) => {
    if (l.user_id) acc[l.user_id] = (acc[l.user_id] ?? 0) + 1
    return acc
  }, {})

  const dealsMap = (allDeals ?? []).reduce<Record<string, { count: number; revenue: number }>>((acc, d) => {
    if (!d.agent_id) return acc
    if (!acc[d.agent_id]) acc[d.agent_id] = { count: 0, revenue: 0 }
    acc[d.agent_id].count += 1
    acc[d.agent_id].revenue += Number(d.unit_value ?? d.amount ?? d.value ?? 0)
    return acc
  }, {})

  const agentStats: AgentStats[] = (agents ?? []).map(agent => {
    const leads = leadsMap[agent.id] ?? 0
    const { count: dealCount = 0, revenue = 0 } = dealsMap[agent.id] ?? {} as { count: number; revenue: number }
    return {
      id: agent.id,
      full_name: agent.full_name ?? 'وكيل',
      leads,
      deals: dealCount,
      revenue,
      conversion: leads > 0 ? Math.round((dealCount / leads) * 100) : 0,
    }
  })

  // ترتيب حسب الإيراد
  agentStats.sort((a, b) => b.revenue - a.revenue)

  const topAgent = agentStats[0]
  const totalRevenue = agentStats.reduce((s, a) => s + a.revenue, 0)
  const totalDeals = agentStats.reduce((s, a) => s + a.deals, 0)

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="text-indigo-600" size={24} />
          أداء فريق المبيعات
        </h1>
        <p className="text-sm text-slate-500 mt-1">مقارنة شاملة لأداء الوكلاء وتحليل مؤشرات الإنجاز</p>
      </div>

      {/* ملخص عام */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الإيراد', value: `${(totalRevenue / 1_000_000).toFixed(1)}M ج.م`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'إجمالي الصفقات', value: totalDeals, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'عدد الوكلاء', value: agentStats.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'أعلى وكيل', value: topAgent?.full_name ?? '—', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`${kpi.bg} ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <kpi.icon size={20} />
            </div>
            <div className="text-xl font-black text-slate-900 truncate">{kpi.value}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <PerformanceChart agents={agentStats} />

      {/* جدول المقارنة */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">تصنيف الوكلاء حسب الأداء</h2>
        </div>
        {agentStats.length === 0 ? (
          <div className="p-16 text-center text-slate-400">لا يوجد وكلاء مسجلون بعد</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-right p-4 font-semibold text-slate-600">الترتيب</th>
                <th className="text-right p-4 font-semibold text-slate-600">الوكيل</th>
                <th className="text-right p-4 font-semibold text-slate-600">العملاء</th>
                <th className="text-right p-4 font-semibold text-slate-600">الصفقات</th>
                <th className="text-right p-4 font-semibold text-slate-600">الإيراد</th>
                <th className="text-right p-4 font-semibold text-slate-600">معدل التحويل</th>
                <th className="text-right p-4 font-semibold text-slate-600">الأداء</th>
              </tr>
            </thead>
            <tbody>
              {agentStats.map((agent, i) => {
                const maxRevenue = agentStats[0]?.revenue || 1
                const barWidth = Math.round((agent.revenue / maxRevenue) * 100)
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
                return (
                  <tr key={agent.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-lg">{medal}</td>
                    <td className="p-4 font-semibold text-slate-800">{agent.full_name}</td>
                    <td className="p-4 text-slate-600">{agent.leads}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        {agent.deals}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-700">
                      {(agent.revenue / 1_000_000).toFixed(2)}M
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        agent.conversion >= 30 ? 'bg-emerald-100 text-emerald-700' :
                        agent.conversion >= 15 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {agent.conversion}%
                      </span>
                    </td>
                    <td className="p-4 w-32">
                      <div className="bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
