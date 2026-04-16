import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AlertTriangle, Users, TrendingUp, UserPlus, Phone, ShieldCheck, Clock, DollarSign, Target, BarChart2, Activity, FileDown, Zap } from 'lucide-react'
import Link from 'next/link'
import ExecutiveMiniChart from './ExecutiveMiniChart'
import PipelineFunnel from './PipelineFunnel'
import TopAgentsLeaderboard from './TopAgentsLeaderboard'

export const dynamic = 'force-dynamic'

interface AgentRow { id: string; full_name: string | null; phone: string | null; status: string | null }
interface DealRow  { id: string; unit_value: number | null; stage: string | null; created_at: string; assigned_to: string | null }
interface LeadRow  { id: string; status: string | null; expected_value: number | null; created_at: string; assigned_to: string | null }

const DEAL_STAGES = ['New', 'Negotiation', 'Site Visit', 'Offer Sent', 'Contracted', 'Registration', 'Handover']

export default async function CompanyDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile, error: profileError },
    { data: agents },
    { data: leads },
    { data: deals },
    { data: commissions },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id).single(),
    supabase.from('profiles').select('id, full_name, phone, status').eq('company_id', user?.id).order('created_at', { ascending: false }),
    supabase.from('leads').select('id, status, expected_value, created_at, assigned_to').eq('company_id', user?.id),
    supabase.from('deals').select('id, unit_value, stage, created_at, assigned_to').eq('company_id', user?.id),
    supabase.from('commissions').select('amount, status').eq('company_id', user?.id),
  ])

  if (profileError) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl flex items-start gap-4 m-8" dir="rtl">
        <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
        <div>
          <h3 className="font-bold text-red-800">خطأ في جلب البيانات</h3>
          <p className="text-sm text-red-600 mt-1">{profileError.message}</p>
        </div>
      </div>
    )
  }

  // ─── KPI Calculations ────────────────────────────────────────
  const agentsCount      = agents?.length ?? 0
  const activeAgents     = agents?.filter(a => a.status === 'approved').length ?? 0
  const totalLeads       = leads?.length ?? 0
  const freshLeads       = leads?.filter(l => l.status === 'Fresh Leads').length ?? 0
  const contractedDeals  = (deals as DealRow[] ?? []).filter(d => ['Contracted','Registration','Handover'].includes(d.stage ?? ''))
  const totalRevenue     = contractedDeals.reduce((s, d) => s + Number(d.unit_value ?? 0), 0)
  const totalDeals       = deals?.length ?? 0
  const pendingComm      = (commissions ?? []).filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount ?? 0), 0)
  const paidComm         = (commissions ?? []).filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount ?? 0), 0)
  const convRate         = totalLeads > 0 ? ((contractedDeals.length / totalLeads) * 100).toFixed(1) : '0.0'

  // ─── Monthly Revenue (last 6 months) ──────────────────────────
  const now = new Date()
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - (5 - i))
    const label = d.toLocaleDateString('ar-EG', { month: 'short' })
    const rev = (deals as DealRow[] ?? [])
      .filter(deal => {
        const dd = new Date(deal.created_at)
        return dd.getMonth() === d.getMonth() && dd.getFullYear() === d.getFullYear()
      })
      .reduce((s, deal) => s + Number(deal.unit_value ?? 0), 0)
    return { month: label, revenue: rev }
  })

  // ─── Pipeline by stage ────────────────────────────────────────
  const pipelineData = DEAL_STAGES.map(stage => {
    const stagDeals = (deals as DealRow[] ?? []).filter(d => d.stage === stage)
    return {
      stage,
      count: stagDeals.length,
      value: stagDeals.reduce((s, d) => s + Number(d.unit_value ?? 0), 0),
    }
  }).filter(d => d.count > 0)

  // ─── Top agents by revenue ────────────────────────────────────
  const agentStats = (agents as AgentRow[] ?? []).map(agent => {
    const agentDeals = (deals as DealRow[] ?? []).filter(d => d.assigned_to === agent.id)
    const agentLeads = (leads as LeadRow[] ?? []).filter(l => l.assigned_to === agent.id)
    return {
      id: agent.id,
      name: agent.full_name ?? 'وكيل',
      deals: agentDeals.length,
      revenue: agentDeals.reduce((s, d) => s + Number(d.unit_value ?? 0), 0),
      leads: agentLeads.length,
    }
  })

  // ─── This month vs last month ─────────────────────────────────
  const thisMonth = monthlyRevenue[5]?.revenue ?? 0
  const lastMonth = monthlyRevenue[4]?.revenue ?? 0
  const growthPct = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : null

  const kpis = [
    { label: 'إجمالي الإيراد', value: `${(totalRevenue / 1_000_000).toFixed(1)}M`, sub: 'ج.م', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'العملاء المحتملون', value: totalLeads, sub: `${freshLeads} جديد`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'الصفقات المبرمة', value: contractedDeals.length, sub: `من ${totalDeals} إجمالي`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'معدل التحويل', value: `${convRate}%`, sub: 'عميل → صفقة', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { label: 'فريق المبيعات', value: agentsCount, sub: `${activeAgents} نشط`, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
    { label: 'عمولات معلقة', value: `${(pendingComm / 1_000).toFixed(0)}K`, sub: `${(paidComm / 1_000).toFixed(0)}K مدفوع`, icon: BarChart2, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  ]

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            مرحباً، {profile?.company_name ?? profile?.full_name ?? 'المدير'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            لوحة القيادة التنفيذية
            {growthPct !== null && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Number(growthPct) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {Number(growthPct) >= 0 ? '↑' : '↓'} {Math.abs(Number(growthPct))}% هذا الشهر
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/forecasting"
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm">
            <TrendingUp size={16} /> التنبؤ
          </Link>
          <a href={`/api/reports/monthly-pdf?month=${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`}
            target="_blank" rel="noopener noreferrer"
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm">
            <FileDown size={16} /> تقرير الشهر
          </a>
          <Link href="/company/agents/add"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 text-sm">
            <UserPlus size={16} /> إضافة وكيل
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-2xl p-5 shadow-sm border ${kpi.border} hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-3">
              <div className={`${kpi.bg} ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{kpi.sub}</div>
            <div className="text-xs text-slate-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Pipeline */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ExecutiveMiniChart data={monthlyRevenue} />
        <PipelineFunnel data={pipelineData} />
      </div>

      {/* Top Agents + Quick Links */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopAgentsLeaderboard agents={agentStats} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-2">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Zap size={15} className="text-amber-500" /> وصول سريع
          </h3>
          {[
            { label: 'إدارة العملاء',   href: '/dashboard/leads',       color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { label: 'الصفقات',         href: '/dashboard/deals',       color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            { label: 'المخزون العقاري', href: '/dashboard/inventory',   color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
            { label: 'أداء الفريق',     href: '/dashboard/performance', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            { label: 'العمولات',        href: '/dashboard/commissions', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
            { label: 'المطورون',        href: '/dashboard/developers',  color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
            { label: 'التقارير',        href: '/dashboard/reports',     color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
            { label: 'سجل العمليات',   href: '/dashboard/audit',       color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className={`${l.color} flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-colors`}>
              {l.label}
              <span className="opacity-50">←</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users size={20} className="text-blue-600" /> فريق المبيعات
          </h3>
          <Link href="/dashboard/performance" className="text-sm text-blue-600 font-bold hover:underline">
            عرض التحليل الكامل ←
          </Link>
        </div>

        {agentsCount === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">لا يوجد وكلاء مسجلون</p>
            <Link href="/company/agents/add" className="mt-3 inline-flex items-center gap-1 text-blue-600 font-bold hover:underline text-sm">
              إضافة أول وكيل <UserPlus size={14} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(agents as AgentRow[]).map(agent => {
              const stat = agentStats.find(s => s.id === agent.id)
              return (
                <div key={agent.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-black text-base shadow-inner">
                      {agent.full_name?.charAt(0) ?? 'و'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{agent.full_name ?? 'وكيل'}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {agent.phone ?? 'بدون رقم'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {stat && (
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-black text-slate-700">{stat.deals} صفقة</div>
                        <div className="text-[10px] text-slate-400">{(stat.revenue/1_000_000).toFixed(1)}M ج.م</div>
                      </div>
                    )}
                    {agent.status === 'approved' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full flex items-center gap-1">
                        <ShieldCheck size={12} /> نشط
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-full flex items-center gap-1">
                        <Clock size={12} /> معلق
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
