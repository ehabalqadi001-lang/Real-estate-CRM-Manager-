import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import {
  Handshake, TrendingUp, Star, Clock, CheckCircle,
  AlertCircle, Flame, Target, Trophy, Zap, ArrowLeft,
  Building2, Percent,
} from 'lucide-react'

async function getBrokerDashboardData(userId: string) {
  const supabase = await createServerClient()

  const [commissionsRes, salesRes, brokerProfileRes, projectsRes] = await Promise.all([
    supabase
      .from('commissions')
      .select('agent_amount, amount, status, created_at')
      .eq('agent_id', userId),

    supabase
      .from('broker_sales_submissions')
      .select('id, client_name, project_name, developer_name, deal_value, broker_commission_amount, stage, status, commission_lifecycle_stage, created_at')
      .eq('broker_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('broker_profiles')
      .select('rating, verification_status')
      .eq('profile_id', userId)
      .maybeSingle(),

    // Featured projects with high commissions for the promo banner
    supabase
      .from('projects')
      .select('id, name, developer_name, commission_rate')
      .eq('status', 'active')
      .order('commission_rate', { ascending: false })
      .limit(3),
  ])

  const commissions = commissionsRes.data ?? []
  const sales = salesRes.data ?? []
  const brokerProfile = brokerProfileRes.data
  const featuredProjects = projectsRes.data ?? []

  const getAmount = (c: { agent_amount: number | null; amount: number | null }) =>
    Number(c.agent_amount ?? c.amount ?? 0)

  const pendingAmount = commissions
    .filter(c => c.status === 'pending' || c.status === 'approved')
    .reduce((sum, c) => sum + getAmount(c), 0)

  const paidAmount = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + getAmount(c), 0)

  const approvedSales = sales.filter(s => s.status === 'approved').length
  const pendingSales = sales.filter(s => s.status === 'submitted' || s.status === 'under_review').length

  return { commissions, sales, brokerProfile, pendingAmount, paidAmount, approvedSales, pendingSales, featuredProjects }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

const STAGE_LABELS: Record<string, string> = {
  eoi: 'EOI', reservation: 'حجز', contract: 'عقد',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted:    { label: 'قيد المراجعة',  color: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'جارٍ المراجعة', color: 'bg-blue-100 text-blue-700' },
  approved:     { label: 'معتمدة',         color: 'bg-emerald-100 text-emerald-700' },
  rejected:     { label: 'مرفوضة',        color: 'bg-red-100 text-red-700' },
}

// Motivational messages based on performance
function getMotivationMessage(paidAmount: number, approvedSales: number, firstName: string) {
  if (paidAmount === 0 && approvedSales === 0) {
    return {
      headline: `يلا نبدأ يا ${firstName}! 🚀`,
      sub: 'أول بيعة هي الأصعب — بعدها كل شيء يصبح أسهل. ارفع بيعتك الأولى الآن.',
      cta: 'رفع بيعة جديدة',
      href: '/broker-portal/sales',
      color: 'from-emerald-600 to-teal-600',
    }
  }
  if (approvedSales >= 1 && approvedSales < 3) {
    return {
      headline: `شغل ممتاز يا ${firstName}! 💪`,
      sub: `لديك ${approvedSales} صفقة معتمدة — الأبطال لا يتوقفون. ضاعف مبيعاتك وضاعف دخلك.`,
      cta: 'شاهد عمولاتك',
      href: '/broker-portal/commissions',
      color: 'from-blue-600 to-indigo-600',
    }
  }
  if (approvedSales >= 3) {
    return {
      headline: `أنت نجم المبيعات يا ${firstName}! 🏆`,
      sub: `${approvedSales} صفقة معتمدة — أداء استثنائي! استمر وكن الأول في المتصفح.`,
      cta: 'صفقاتي',
      href: '/broker-portal/deals',
      color: 'from-purple-600 to-pink-600',
    }
  }
  return {
    headline: `أهلاً يا ${firstName}! ✨`,
    sub: 'كل يوم جديد فرصة لصفقة جديدة. لوحة التحكم تتابع أداءك لحظة بلحظة.',
    cta: 'رفع بيعة',
    href: '/broker-portal/sales',
    color: 'from-emerald-600 to-teal-600',
  }
}

export default async function BrokerPortalPage() {
  const session = await requireSession()
  const data = await getBrokerDashboardData(session.user.id)

  const firstName = session.profile.full_name?.split(' ')[0] ?? 'وسيط'
  const verificationStatus = data.brokerProfile?.verification_status ?? 'pending'
  const isVerified = verificationStatus === 'verified'
  const isPending = verificationStatus === 'pending' || verificationStatus === 'under_review'
  const motivation = getMotivationMessage(data.paidAmount, data.approvedSales, firstName)

  const stats = [
    {
      label: 'عمولات معلّقة',
      value: `${fmt(data.pendingAmount)} ج.م`,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
    },
    {
      label: 'عمولات مدفوعة',
      value: `${fmt(data.paidAmount)} ج.م`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: 'صفقات معتمدة',
      value: data.approvedSales.toString(),
      icon: Trophy,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'قيد المراجعة',
      value: data.pendingSales.toString(),
      icon: Handshake,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
    },
  ]

  return (
    <div className="space-y-5" dir="rtl">

      {/* ── Verification alert ── */}
      {!isVerified && (
        <div className={`rounded-xl p-4 border flex items-start gap-3 ${
          isPending
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${isPending ? 'text-amber-600' : 'text-red-600'}`} />
          <div>
            <p className={`font-bold text-sm ${isPending ? 'text-amber-800 dark:text-amber-300' : 'text-red-800 dark:text-red-300'}`}>
              {isPending ? 'حسابك قيد المراجعة' : 'يجب إكمال التوثيق'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {isPending
                ? 'سيتم إشعارك عبر البريد الإلكتروني عند الموافقة على حسابك.'
                : 'أكمل رفع وثائق الهوية للحصول على صلاحيات كاملة.'}
            </p>
            {!isPending && (
              <a href="/broker-portal/profile" className="text-xs font-bold text-emerald-600 underline mt-1 inline-block">
                إكمال التوثيق ←
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Welcome / Motivation Banner ── */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-l ${motivation.color} p-5 text-white`}>
        {/* Background decorative elements */}
        <div className="absolute -left-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute left-1/3 top-0 w-px h-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">لوحة الأداء</span>
            </div>
            <h1 className="text-xl font-black leading-snug">{motivation.headline}</h1>
            <p className="text-sm text-white/80 mt-1.5 leading-relaxed">{motivation.sub}</p>
            <a
              href={motivation.href}
              className="inline-flex items-center gap-2 mt-3 bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-bold px-4 py-2 rounded-xl"
            >
              {motivation.cta}
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
          <div className="shrink-0 hidden sm:flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Zap className="w-7 h-7 text-yellow-300" />
            </div>
            {data.brokerProfile?.rating && (
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                <span className="text-xs font-black">{data.brokerProfile.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar toward next milestone */}
        {data.paidAmount > 0 && (
          <div className="relative mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" /> الهدف الشهري</span>
              <span className="font-bold text-white">{fmt(data.paidAmount)} / {fmt(100000)} ج.م</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                // eslint-disable-next-line no-inline-styles/no-inline-styles
                style={{ width: `${Math.min((data.paidAmount / 100000) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg} ${border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-xl font-black ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Featured Projects / Ad Banner ── */}
      {data.featuredProjects.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-sm text-emerald-800 dark:text-emerald-300">مشاريع بعمولات مميّزة 🔥</span>
            </div>
            <a href="/broker-portal/inventory" className="text-xs font-bold text-emerald-600 hover:underline">
              عرض الكل
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-emerald-200/60 dark:divide-emerald-800/60">
            {data.featuredProjects.map((proj, i) => (
              <div key={proj.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{proj.name}</p>
                  <p className="text-xs text-gray-500 truncate">{proj.developer_name ?? '—'}</p>
                </div>
                {proj.commission_rate && (
                  <div className="shrink-0 flex items-center gap-0.5 bg-emerald-600 text-white rounded-lg px-2 py-1">
                    <Percent className="w-3 h-3" />
                    <span className="text-xs font-black">{proj.commission_rate}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sales Psychology: Quick-action cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: '🚀',
            title: 'ارفع بيعة الآن',
            desc: 'كل دقيقة تأخير = فرصة ضائعة',
            href: '/broker-portal/sales',
            color: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
          },
          {
            icon: '💰',
            title: 'تابع عمولاتك',
            desc: 'شاهد رحلة كل ريال من المطور إليك',
            href: '/broker-portal/commissions',
            color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
          },
          {
            icon: '📋',
            title: 'صفقاتي',
            desc: 'تتبع حالة كل صفقة خطوة بخطوة',
            href: '/broker-portal/deals',
            color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
          },
        ].map(({ icon, title, desc, href, color }) => (
          <a key={href} href={href} className={`flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-gray-900 transition-all ${color} group`}>
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 mr-auto shrink-0 transition-colors" />
          </a>
        ))}
      </div>

      {/* ── Recent Sales ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <Handshake className="w-4 h-4 text-emerald-500" />
            آخر المبيعات المرفوعة
          </h2>
          <a href="/broker-portal/deals" className="text-xs text-emerald-600 hover:underline font-semibold">عرض الكل</a>
        </div>

        {data.sales.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Handshake className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-semibold">لا توجد مبيعات حتى الآن</p>
            <a href="/broker-portal/sales" className="inline-block mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors">
              ارفع بيعتك الأولى ←
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.sales.map(sale => {
              const st = STATUS_LABELS[sale.status ?? 'submitted'] ?? STATUS_LABELS.submitted
              return (
                <div key={sale.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{sale.client_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {sale.project_name ?? '—'}
                      {sale.stage ? ` · ${STAGE_LABELS[sale.stage] ?? sale.stage}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {sale.broker_commission_amount && (
                      <span className="text-xs font-black text-emerald-600">
                        {fmt(Number(sale.broker_commission_amount))} ج.م
                      </span>
                    )}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Rating card ── */}
      {data.brokerProfile?.rating && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">تقييمك: {data.brokerProfile.rating.toFixed(1)} / 5</p>
            <p className="text-xs text-gray-400 mt-0.5">بناءً على تقييمات العملاء والإدارة</p>
          </div>
          <div className="mr-auto flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(data.brokerProfile!.rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
