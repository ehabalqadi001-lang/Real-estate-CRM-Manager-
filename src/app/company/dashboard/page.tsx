import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  AlertTriangle, Users, TrendingUp, UserPlus, Phone, ShieldCheck,
  Clock, DollarSign, Target, Activity, FileDown, Zap, ArrowUpRight,
  ArrowDownRight, Building2, Sparkles, Megaphone, Store, CheckCircle2,
  MapPin, Layers
} from 'lucide-react'
import Link from 'next/link'
import ExecutiveMiniChart from './ExecutiveMiniChart'
import PipelineFunnel from './PipelineFunnel'
import TopAgentsLeaderboard from './TopAgentsLeaderboard'

export const dynamic = 'force-dynamic'

interface AgentRow { id: string; full_name: string | null; phone: string | null; status: string | null }
interface DealRow  { id: string; unit_value: number | null; stage: string | null; created_at: string; assigned_to: string | null }
interface LeadRow  { id: string; status: string | null; source: string | null; expected_value: number | null; created_at: string; assigned_to: string | null }
interface UnitRow  { id: string; unit_name: string | null; project_name: string | null; unit_type: string | null; price: number | null; status: string | null; floor: number | null; area: number | null; created_at: string }

const DEAL_STAGES = ['New', 'Negotiation', 'Site Visit', 'Offer Sent', 'Contracted', 'Registration', 'Handover']

const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'whatsapp':   { label: 'واتساب',     color: 'text-emerald-700', bg: 'bg-emerald-50' },
  'phone':      { label: 'هاتف',       color: 'text-blue-700',    bg: 'bg-blue-50' },
  'website':    { label: 'موقع',       color: 'text-purple-700',  bg: 'bg-purple-50' },
  'referral':   { label: 'إحالة',      color: 'text-amber-700',   bg: 'bg-amber-50' },
  'facebook':   { label: 'فيسبوك',    color: 'text-blue-700',    bg: 'bg-blue-50' },
  'instagram':  { label: 'انستجرام',  color: 'text-pink-700',    bg: 'bg-pink-50' },
  'exhibition': { label: 'معرض',      color: 'text-orange-700',  bg: 'bg-orange-50' },
}

export default async function CompanyDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: profile, error: profileError },
    { data: agents },
    { data: leads },
    { data: deals },
    { data: commissions },
    { data: availableUnits },
    { data: newLaunches },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id).single(),
    supabase.from('profiles').select('id, full_name, phone, status').eq('company_id', user?.id).order('created_at', { ascending: false }),
    supabase.from('leads').select('id, status, source, expected_value, created_at, assigned_to').eq('company_id', String(user?.id ?? '')),
    supabase.from('deals').select('id, unit_value, stage, created_at, assigned_to').eq('company_id', user?.id),
    supabase.from('commissions').select('amount, status').eq('company_id', user?.id),
    supabase.from('inventory')
      .select('id, unit_name, project_name, unit_type, price, status, floor, area, created_at')
      .in('status', ['available', 'Available'])
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('inventory')
      .select('id, unit_name, project_name, unit_type, price, status, floor, area, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(6),
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

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const agentsCount     = agents?.length ?? 0
  const activeAgents    = agents?.filter(a => a.status === 'approved').length ?? 0
  const totalLeads      = leads?.length ?? 0
  const freshLeads      = (leads as LeadRow[] ?? []).filter(l => ['Fresh Leads', 'fresh', 'new'].includes(l.status ?? '')).length
  const contractedDeals = (deals as DealRow[] ?? []).filter(d => ['Contracted', 'Registration', 'Handover'].includes(d.stage ?? ''))
  const totalRevenue    = contractedDeals.reduce((s, d) => s + Number(d.unit_value ?? 0), 0)
  const totalDeals      = deals?.length ?? 0
  const pendingComm     = (commissions ?? []).filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount ?? 0), 0)
  const paidComm        = (commissions ?? []).filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount ?? 0), 0)
  const convRate        = totalLeads > 0 ? ((contractedDeals.length / totalLeads) * 100).toFixed(1) : '0.0'

  // ── Monthly revenue ───────────────────────────────────────────────────────
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

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const pipelineData = DEAL_STAGES.map(stage => {
    const stageDeals = (deals as DealRow[] ?? []).filter(d => d.stage === stage)
    return { stage, count: stageDeals.length, value: stageDeals.reduce((s, d) => s + Number(d.unit_value ?? 0), 0) }
  }).filter(d => d.count > 0)

  // ── Agent stats ───────────────────────────────────────────────────────────
  const agentStats = (agents as AgentRow[] ?? []).map(agent => ({
    id: agent.id,
    name: agent.full_name ?? 'وكيل',
    deals: (deals as DealRow[] ?? []).filter(d => d.assigned_to === agent.id).length,
    revenue: (deals as DealRow[] ?? []).filter(d => d.assigned_to === agent.id).reduce((s, d) => s + Number(d.unit_value ?? 0), 0),
    leads: (leads as LeadRow[] ?? []).filter(l => l.assigned_to === agent.id).length,
  }))

  // ── Growth % ──────────────────────────────────────────────────────────────
  const thisMonth = monthlyRevenue[5]?.revenue ?? 0
  const lastMonth = monthlyRevenue[4]?.revenue ?? 0
  const growthPct = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : null
  const growthPositive = Number(growthPct) >= 0

  // ── Lead sources breakdown ────────────────────────────────────────────────
  const sourceMap = (leads as LeadRow[] ?? []).reduce<Record<string, number>>((acc, l) => {
    const src = l.source?.toLowerCase() ?? 'غير محدد'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})
  const topSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxSourceCount = topSources[0]?.[1] || 1

  const fmtM = (n: number) => `${(n / 1_000_000).toFixed(2)}M`
  const fmtK = (n: number) => `${(n / 1_000).toFixed(0)}K`
  const fmtPrice = (n: number) =>
    new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

  const kpis = [
    { label: 'إجمالي الإيراد', value: fmtM(totalRevenue), sub: 'ج.م · صفقات مبرمة', icon: DollarSign,
      trend: growthPct ? `${growthPositive ? '+' : ''}${growthPct}%` : null, trendUp: growthPositive,
      color: 'text-[#00C27C]', bg: 'bg-[#00C27C]/10', border: 'border-[#00C27C]/20' },
    { label: 'العملاء المحتملون', value: String(totalLeads), sub: `${freshLeads} جديد`, icon: Users,
      trend: null, trendUp: true, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'الصفقات المبرمة', value: String(contractedDeals.length), sub: `من ${totalDeals} إجمالي`, icon: Target,
      trend: null, trendUp: true, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'معدل التحويل', value: `${convRate}%`, sub: 'عميل → صفقة', icon: TrendingUp,
      trend: null, trendUp: true, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'فريق المبيعات', value: String(agentsCount), sub: `${activeAgents} وكيل نشط`, icon: Activity,
      trend: null, trendUp: true, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
    { label: 'عمولات معلقة', value: fmtK(pendingComm), sub: `${fmtK(paidComm)} K مدفوع`, icon: DollarSign,
      trend: null, trendUp: false, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  ]

  return (
    <div className="p-5 space-y-5 bg-[#F4F6F9] min-h-screen" dir="rtl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00C27C] to-[#009F64] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#00C27C]/20">
              {(profile?.company_name ?? profile?.full_name ?? 'م').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">
                  {profile?.company_name ?? profile?.full_name ?? 'المدير'}
                </h1>
                {growthPct !== null && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${growthPositive ? 'bg-[#00C27C]/10 text-[#00C27C]' : 'bg-red-50 text-red-700'}`}>
                    {growthPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {Math.abs(Number(growthPct))}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">لوحة القيادة التنفيذية · {now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/forecasting"
              className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3.5 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all text-sm">
              <TrendingUp size={14} /> التنبؤ
            </Link>
            <a href={`/api/reports/monthly-pdf?month=${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`}
              target="_blank" rel="noopener noreferrer"
              className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3.5 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all text-sm">
              <FileDown size={14} /> تقرير
            </a>
            <Link href="/company/agents/add"
              className="bg-[#00C27C] hover:bg-[#009F64] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#00C27C]/20 text-sm">
              <UserPlus size={14} /> إضافة وكيل
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-2xl p-5 shadow-sm border ${kpi.border} hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`${kpi.bg} w-9 h-9 rounded-xl flex items-center justify-center`}>
                <kpi.icon size={17} className={kpi.color} />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${kpi.trendUp ? 'bg-[#00C27C]/10 text-[#00C27C]' : 'bg-red-50 text-red-700'}`}>
                  {kpi.trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">{kpi.value}</p>
            <p className="text-[10px] text-slate-400 mt-1.5">{kpi.sub}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ExecutiveMiniChart data={monthlyRevenue} />
        <PipelineFunnel data={pipelineData} />
      </div>

      {/* ── Marketplace (سوق الوحدات المتاحة) ──────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00C27C]/10 flex items-center justify-center">
              <Store size={16} className="text-[#00C27C]" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm">سوق الوحدات المتاحة</h3>
              <p className="text-[10px] text-slate-400">وحدات جاهزة للبيع — اعرضها على عملائك</p>
            </div>
          </div>
          <Link href="/dashboard/inventory" className="text-xs text-[#00C27C] font-bold hover:underline flex items-center gap-1">
            عرض الكل <ArrowUpRight size={12} />
          </Link>
        </div>
        {(!availableUnits || availableUnits.length === 0) ? (
          <div className="p-10 text-center text-slate-400">
            <Building2 size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm font-semibold">لا توجد وحدات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {(availableUnits as UnitRow[]).map(unit => (
              <div key={unit.id} className="border border-slate-100 rounded-xl p-4 hover:border-[#00C27C]/40 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] bg-[#00C27C]/10 text-[#00C27C] font-bold px-2 py-0.5 rounded-full">
                    {unit.unit_type ?? 'وحدة'}
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={9} /> متاح
                  </span>
                </div>
                <p className="font-black text-slate-800 text-sm mt-2 truncate">{unit.project_name ?? unit.unit_name ?? 'وحدة'}</p>
                {unit.unit_name && unit.unit_name !== unit.project_name && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{unit.unit_name}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                  {unit.floor && <span className="flex items-center gap-0.5"><Layers size={9} /> دور {unit.floor}</span>}
                  {unit.area && <span className="flex items-center gap-0.5"><MapPin size={9} /> {unit.area}م²</span>}
                </div>
                <p className="text-sm font-black text-[#00C27C] mt-2">
                  {unit.price ? `${fmtPrice(unit.price)} ج.م` : 'السعر عند الطلب'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── New Launches + Lead Sources ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* New Launches */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Sparkles size={16} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">إطلاقات جديدة</h3>
                <p className="text-[10px] text-slate-400">وحدات أضيفت خلال آخر 30 يوماً</p>
              </div>
            </div>
            <Link href="/dashboard/inventory" className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1">
              الكل <ArrowUpRight size={12} />
            </Link>
          </div>
          {(!newLaunches || newLaunches.length === 0) ? (
            <div className="p-8 text-center text-slate-400">
              <Sparkles size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-semibold">لا يوجد إطلاقات حديثة</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {(newLaunches as UnitRow[]).map(unit => (
                <div key={unit.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{unit.project_name ?? unit.unit_name ?? 'وحدة'}</p>
                      <p className="text-[10px] text-slate-400 truncate">{unit.unit_type} {unit.area ? `· ${unit.area}م²` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 font-black px-1.5 py-0.5 rounded-full">جديد</span>
                    <p className="text-sm font-black text-[#00C27C]">{unit.price ? `${fmtPrice(unit.price)}` : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advertising / Lead Sources */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Megaphone size={16} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">مصادر العملاء</h3>
                <p className="text-[10px] text-slate-400">تحليل أداء قنوات التسويق</p>
              </div>
            </div>
            <Link href="/dashboard/analytics" className="text-xs text-purple-600 font-bold hover:underline flex items-center gap-1">
              تحليل <ArrowUpRight size={12} />
            </Link>
          </div>
          {topSources.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Megaphone size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-semibold">لا يوجد بيانات مصادر بعد</p>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {topSources.map(([src, count]) => {
                const cfg = SOURCE_LABELS[src] ?? { label: src, color: 'text-slate-700', bg: 'bg-slate-50' }
                const pct = Math.round((count / maxSourceCount) * 100)
                const totalPct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
                return (
                  <div key={src}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs font-black text-slate-700">{count} <span className="text-slate-400 font-normal">({totalPct}%)</span></span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                      <div className="h-full bg-gradient-to-l from-[#00C27C] to-[#009F64] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 border-t border-slate-50 flex justify-between text-xs text-slate-400 font-semibold">
                <span>إجمالي العملاء</span>
                <span className="font-black text-slate-700">{totalLeads}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Leaderboard + Quick links ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TopAgentsLeaderboard agents={agentStats} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2 text-sm">
            <Zap size={14} className="text-amber-500" /> وصول سريع
          </h3>
          <div className="space-y-1">
            {[
              { label: 'إدارة العملاء',      href: '/dashboard/leads',       color: 'hover:bg-blue-50 hover:text-blue-700' },
              { label: 'الصفقات',             href: '/dashboard/deals',       color: 'hover:bg-purple-50 hover:text-purple-700' },
              { label: 'سوق الوحدات',        href: '/dashboard/inventory',   color: 'hover:bg-[#00C27C]/10 hover:text-[#00C27C]' },
              { label: 'إدارة الوسطاء',      href: '/dashboard/brokers',     color: 'hover:bg-amber-50 hover:text-amber-700' },
              { label: 'الأهداف الشهرية',    href: '/dashboard/targets',     color: 'hover:bg-orange-50 hover:text-orange-700' },
              { label: 'أداء الفريق',        href: '/dashboard/performance', color: 'hover:bg-teal-50 hover:text-teal-700' },
              { label: 'العمولات',            href: '/dashboard/commissions', color: 'hover:bg-rose-50 hover:text-rose-700' },
              { label: 'التقارير',            href: '/dashboard/analytics',   color: 'hover:bg-indigo-50 hover:text-indigo-700' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className={`${l.color} flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 transition-colors`}>
                {l.label}
                <ArrowUpRight size={13} className="opacity-40" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Agents table ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
            <Users size={16} className="text-[#00C27C]" /> فريق المبيعات
          </h3>
          <Link href="/dashboard/performance" className="text-xs text-[#00C27C] font-bold hover:underline">
            عرض التحليل الكامل ←
          </Link>
        </div>
        {agentsCount === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users size={36} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-sm">لا يوجد وكلاء مسجلون</p>
            <Link href="/company/agents/add"
              className="mt-3 inline-flex items-center gap-1 text-[#00C27C] font-bold hover:underline text-sm">
              إضافة أول وكيل <UserPlus size={13} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {(agents as AgentRow[]).map(agent => {
              const stat = agentStats.find(s => s.id === agent.id)
              return (
                <div key={agent.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#00C27C] to-[#009F64] text-white flex items-center justify-center font-black text-sm shadow">
                      {agent.full_name?.charAt(0) ?? 'و'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{agent.full_name ?? 'وكيل'}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone size={9} /> {agent.phone ?? 'بدون رقم'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {stat && (
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-slate-700">{stat.deals} صفقة</div>
                        <div className="text-[10px] text-slate-400">{fmtM(stat.revenue)} ج.م</div>
                      </div>
                    )}
                    {agent.status === 'approved'
                      ? <span className="px-2.5 py-1 bg-[#00C27C]/10 text-[#00C27C] text-xs font-bold rounded-full flex items-center gap-1 border border-[#00C27C]/20"><ShieldCheck size={11} /> نشط</span>
                      : <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1 border border-amber-100"><Clock size={11} /> معلق</span>}
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
