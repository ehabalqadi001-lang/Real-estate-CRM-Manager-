import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import {
  ArrowUpRight, Phone, Target, TrendingUp, Users,
  Building2, CheckCircle2, Clock, Flame, Star, Layers, MapPin
} from 'lucide-react'
import LeadScoreBadge from '@/components/leads/LeadScoreBadge'

export const dynamic = 'force-dynamic'

export default async function AgentDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: leads },
    { data: availableUnits },
    { data: myDeals },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user?.id).single(),
    supabase.from('leads').select('*').or(`assigned_to.eq.${user?.id},user_id.eq.${user?.id}`),
    supabase.from('inventory')
      .select('id, unit_name, project_name, unit_type, price, floor, area, status')
      .in('status', ['available', 'Available'])
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('deals')
      .select('id, title, stage, unit_value, created_at')
      .eq('assigned_to', user?.id ?? '')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const safeLeads = leads || []
  const newLeads   = safeLeads.filter(l => ['new', 'Fresh Leads', 'fresh'].includes(l.status ?? ''))
  const wonLeads   = safeLeads.filter(l => l.status === 'Won' || l.status === 'Contracted')
  const hotLeads   = safeLeads.filter(l => (l.score ?? 0) >= 70)
  const totalWonValue = wonLeads.reduce((s, l) => s + (Number(l.expected_value) || 0), 0)

  const fmtPrice = (n: number) =>
    new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

  const STAGE_COLORS: Record<string, string> = {
    'New':          'bg-slate-100 text-slate-600',
    'Negotiation':  'bg-blue-50 text-blue-700',
    'Site Visit':   'bg-purple-50 text-purple-700',
    'Contracted':   'bg-[#00C27C]/10 text-[#00C27C]',
    'Registration': 'bg-amber-50 text-amber-700',
    'Handover':     'bg-teal-50 text-teal-700',
    'Lost':         'bg-red-50 text-red-700',
  }

  return (
    <div className="p-5 space-y-5 min-h-screen bg-[#F4F6F9]" dir="rtl">

      {/* ── Welcome header ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-l from-[#0C1A2E] to-[#0F2748] rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#00C27C] text-xs font-bold uppercase tracking-widest mb-1">مساحة عملك</p>
            <h1 className="text-2xl font-black">أهلاً، {profile?.full_name ?? 'وكيل'}</h1>
            <p className="text-white/50 text-sm mt-1">متابعة عملائك وصفقاتك في مكان واحد</p>
          </div>
          <Link href="/dashboard/leads"
            className="bg-[#00C27C] hover:bg-[#009F64] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#00C27C]/30 text-sm shrink-0">
            مسار المبيعات <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* Mini stats inside header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/[0.08]">
          {[
            { label: 'إجمالي العملاء', value: safeLeads.length, icon: Users, color: 'text-blue-300' },
            { label: 'مبيعات محققة', value: `${(totalWonValue / 1_000_000).toFixed(1)}M`, icon: TrendingUp, color: 'text-[#00C27C]' },
            { label: 'عملاء جدد', value: newLeads.length, icon: Flame, color: 'text-amber-300' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <s.icon size={18} className={`${s.color} mx-auto mb-1`} />
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-[10px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* New leads assigned */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Flame size={15} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">تكليفات القيادة</h3>
                <p className="text-[10px] text-slate-400">{newLeads.length} عميل ينتظر اتصالك</p>
              </div>
            </div>
            <Link href="/dashboard/leads" className="text-xs text-[#00C27C] font-bold hover:underline flex items-center gap-0.5">
              كل العملاء <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="p-4">
            {newLeads.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={32} className="mx-auto text-[#00C27C] opacity-40 mb-2" />
                <p className="text-sm font-semibold text-slate-500">رائع! لا يوجد عملاء جدد معلقون</p>
              </div>
            ) : (
              <div className="space-y-2">
                {newLeads.slice(0, 5).map(lead => (
                  <div key={lead.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#00C27C]/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C27C] to-[#009F64] text-white flex items-center justify-center font-black text-xs shrink-0">
                        {lead.client_name?.charAt(0) ?? 'ع'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{lead.client_name}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone size={9} /> {lead.phone ?? 'بدون رقم'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <LeadScoreBadge score={lead.score || 0} />
                      <Link href={`/dashboard/leads/${lead.id}`}
                        className="bg-white border border-slate-200 hover:border-[#00C27C] text-[#00C27C] px-3 py-1.5 rounded-lg text-xs font-black transition-all">
                        بدء العمل
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hot leads */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <Star size={15} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">عملاء ساخنون</h3>
                <p className="text-[10px] text-slate-400">نقاط تقييم +70 — الأولوية القصوى</p>
              </div>
            </div>
            <Link href="/dashboard/leads" className="text-xs text-red-500 font-bold hover:underline flex items-center gap-0.5">
              الكل <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="p-4">
            {hotLeads.length === 0 ? (
              <div className="text-center py-8">
                <Target size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm font-semibold text-slate-400">لا يوجد عملاء ساخنون الآن</p>
                <p className="text-xs text-slate-400 mt-1">تواصل مع عملائك لرفع نقاط تقييمهم</p>
              </div>
            ) : (
              <div className="space-y-2">
                {hotLeads.slice(0, 5).map(lead => (
                  <Link key={lead.id} href={`/dashboard/leads/${lead.id}`}
                    className="flex items-center justify-between p-3.5 bg-red-50/50 rounded-xl border border-red-100/50 hover:border-red-200 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{lead.client_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{lead.project_interest ?? 'غير محدد'}</p>
                    </div>
                    <LeadScoreBadge score={lead.score || 0} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── My deals pipeline ────────────────────────────────────────── */}
      {myDeals && myDeals.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00C27C]/10 flex items-center justify-center">
                <TrendingUp size={15} className="text-[#00C27C]" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">صفقاتي الحالية</h3>
                <p className="text-[10px] text-slate-400">{myDeals.length} صفقة نشطة</p>
              </div>
            </div>
            <Link href="/dashboard/deals" className="text-xs text-[#00C27C] font-bold hover:underline flex items-center gap-0.5">
              كل الصفقات <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {myDeals.map(deal => (
              <div key={deal.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{deal.title ?? 'صفقة'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(deal.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {deal.unit_value ? (
                    <p className="text-sm font-black text-[#00C27C]">{fmtPrice(Number(deal.unit_value))} ج.م</p>
                  ) : null}
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STAGE_COLORS[deal.stage ?? 'New'] ?? 'bg-slate-100 text-slate-600'}`}>
                    {deal.stage ?? 'جديد'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Available units marketplace ──────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00C27C]/10 flex items-center justify-center">
              <Building2 size={15} className="text-[#00C27C]" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm">وحدات جاهزة للعرض</h3>
              <p className="text-[10px] text-slate-400">اعرض هذه الوحدات على عملائك الساخنين</p>
            </div>
          </div>
          <Link href="/dashboard/inventory" className="text-xs text-[#00C27C] font-bold hover:underline flex items-center gap-0.5">
            كل الوحدات <ArrowUpRight size={11} />
          </Link>
        </div>
        {(!availableUnits || availableUnits.length === 0) ? (
          <div className="p-8 text-center text-slate-400">
            <Building2 size={28} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">لا توجد وحدات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            {availableUnits.map(unit => (
              <Link key={unit.id} href="/dashboard/inventory"
                className="border border-slate-100 rounded-xl p-4 hover:border-[#00C27C]/40 hover:shadow-sm transition-all">
                <span className="text-[10px] bg-[#00C27C]/10 text-[#00C27C] font-bold px-2 py-0.5 rounded-full">
                  {unit.unit_type ?? 'وحدة'}
                </span>
                <p className="font-black text-slate-800 text-sm mt-2 truncate">{unit.project_name ?? unit.unit_name ?? 'وحدة'}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                  {unit.floor && <span className="flex items-center gap-0.5"><Layers size={9} /> دور {unit.floor}</span>}
                  {unit.area && <span className="flex items-center gap-0.5"><MapPin size={9} /> {unit.area}م²</span>}
                </div>
                <p className="text-sm font-black text-[#00C27C] mt-1.5">
                  {unit.price ? `${fmtPrice(Number(unit.price))} ج.م` : 'السعر عند الطلب'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'إضافة عميل',     href: '/dashboard/leads',        icon: Users,     color: 'bg-blue-600' },
          { label: 'تسجيل صفقة',     href: '/dashboard/deals',        icon: TrendingUp, color: 'bg-[#00C27C]' },
          { label: 'Kanban Pipeline', href: '/dashboard/deals/kanban', icon: Clock,     color: 'bg-purple-600' },
          { label: 'عمولاتي',        href: '/dashboard/commissions',  icon: Target,    color: 'bg-amber-500' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`${a.color} text-white rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity shadow-sm`}>
            <a.icon size={20} />
            <span className="text-xs font-bold text-center">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
