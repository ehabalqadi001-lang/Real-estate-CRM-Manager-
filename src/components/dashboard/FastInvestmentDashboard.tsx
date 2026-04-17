'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  BellRing,
  Bot,
  Building2,
  CircleDollarSign,
  Clock,
  Filter,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WalletCards,
} from 'lucide-react'

type DashboardMetric = {
  totalLeads: number
  freshLeads: number
  totalDeals: number
  wonDeals: number
  revenue: number
  pendingAds: number
  unreadNotifications: number
  role: string
  name: string
}

type ChartPoint = {
  label: string
  leads: number
  deals: number
  revenue: number
}

type FeedItem = {
  title: string
  message: string
  tone: 'gold' | 'success' | 'info' | 'danger'
}

export function FastInvestmentDashboard({
  metrics,
  chartData,
}: {
  metrics: DashboardMetric
  chartData: ChartPoint[]
}) {
  const persona = resolvePersona(metrics.role)
  const conversion = metrics.totalLeads ? Math.round((metrics.wonDeals / metrics.totalLeads) * 100) : 0
  const feed = buildFeed(metrics, persona)

  const cards = [
    {
      label: 'إجمالي العملاء',
      value: metrics.totalLeads.toLocaleString('ar-EG'),
      detail: `${metrics.freshLeads.toLocaleString('ar-EG')} جديد`,
      icon: Users,
      href: '/dashboard/leads',
    },
    {
      label: 'قيمة التداول',
      value: compactMoney(metrics.revenue),
      detail: `${metrics.wonDeals.toLocaleString('ar-EG')} صفقة رابحة`,
      icon: CircleDollarSign,
      href: '/dashboard/deals',
    },
    {
      label: 'معدل التحويل',
      value: `${conversion}%`,
      detail: 'من عميل إلى صفقة',
      icon: Target,
      href: '/dashboard/analytics',
    },
    {
      label: 'إعلانات للمراجعة',
      value: metrics.pendingAds.toLocaleString('ar-EG'),
      detail: 'سوق FAST INVESTMENT',
      icon: ShieldCheck,
      href: '/admin/ad-approvals',
    },
  ]

  return (
    <div className="px-4 py-5 lg:px-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="fi-bento-grid"
      >
        <div className="fi-card col-span-12 overflow-hidden p-5 lg:col-span-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--fi-gold)]">FAST INVESTMENT</p>
              <h2 className="mt-3 text-3xl font-black text-white">لوحة القيادة التنفيذية</h2>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-[var(--fi-muted)]">
                تجربة تشغيل موحدة تتكيف مع دورك الحالي: {persona}. البيانات المركبة تعرض أهم المؤشرات أولا، والتفاصيل المتقدمة تظهر عند الحاجة.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <QuickAction href="/dashboard/deals/kanban" icon={WalletCards} label="Pipeline" />
              <QuickAction href="/marketplace" icon={Building2} label="Marketplace" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {cards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.24 }}
              >
                <Link href={card.href} className="block rounded-lg border border-[var(--fi-line)] bg-white/[0.04] p-4 transition hover:bg-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <card.icon className="size-5 text-[var(--fi-gold)]" />
                    <ArrowUpRight className="size-4 text-white/35" />
                  </div>
                  <p className="fi-tabular mt-4 text-2xl font-black text-white">{card.value}</p>
                  <p className="mt-1 text-xs font-black text-[var(--fi-muted)]">{card.label}</p>
                  <p className="mt-2 text-[11px] font-bold text-[var(--fi-gold)]">{card.detail}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="fi-card col-span-12 p-5 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-white">AI Activity Feed</p>
              <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">إشارات تشغيلية حسب الأولوية</p>
            </div>
            <Bot className="size-6 text-[var(--fi-gold)]" />
          </div>
          <div className="mt-5 space-y-3">
            {feed.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + index * 0.05 }}
                className="rounded-lg border border-white/10 bg-black/18 p-3"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 size-2 rounded-full ${toneClass(item.tone)}`} />
                  <div>
                    <p className="text-sm font-black text-white">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[var(--fi-muted)]">{item.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="fi-card col-span-12 p-5 lg:col-span-7">
          <PanelHeader title="Revenue Intelligence" action="تفاصيل مالية" href="/dashboard/finance" />
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="goldRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1_000_000}M`} />
                <Tooltip contentStyle={{ background: '#10182A', border: '1px solid rgba(201,168,76,.24)', borderRadius: 8, color: '#fff' }} />
                <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={3} fill="url(#goldRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="fi-card col-span-12 p-5 lg:col-span-5">
          <PanelHeader title="Pipeline Density" action="Kanban" href="/dashboard/deals/kanban" />
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#10182A', border: '1px solid rgba(201,168,76,.24)', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="leads" fill="#5CA7FF" radius={[8, 8, 0, 0]} />
                <Bar dataKey="deals" fill="#C9A84C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="fi-card col-span-12 p-5 lg:col-span-4">
          <PanelHeader title="Progressive Filters" action="فتح الفلاتر" href="/dashboard/leads" icon={Filter} />
          <div className="mt-5 space-y-3">
            {['الفترة الزمنية', 'مصدر العميل', 'مرحلة الصفقة', 'الوسيط المسؤول'].map((item) => (
              <button key={item} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-bold text-white/72 transition hover:border-[var(--fi-line)] hover:text-white">
                {item}
                <ArrowUpRight className="size-4 text-white/30" />
              </button>
            ))}
          </div>
        </div>

        <div className="fi-card col-span-12 p-5 lg:col-span-4">
          <PanelHeader title="Team SLA" action="خدمة العملاء" href="/admin/customer-service" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniMetric icon={Clock} value="14m" label="متوسط الاستجابة" />
            <MiniMetric icon={BellRing} value={metrics.unreadNotifications.toLocaleString('ar-EG')} label="تنبيهات غير مقروءة" />
            <MiniMetric icon={ShieldCheck} value={metrics.pendingAds.toLocaleString('ar-EG')} label="اعتمادات معلقة" />
            <MiniMetric icon={Sparkles} value="AI" label="تغذية ذكية" />
          </div>
        </div>

        <div className="fi-card col-span-12 p-5 lg:col-span-4">
          <PanelHeader title="Role Surface" action={persona} href="/dashboard/settings" />
          <div className="mt-5 rounded-lg border border-[var(--fi-line)] bg-[rgba(201,168,76,0.08)] p-4">
            <p className="text-sm font-black text-white">الواجهة الحالية مخصصة لدور: {persona}</p>
            <p className="mt-2 text-xs font-semibold leading-6 text-[var(--fi-muted)]">
              يتم ضبط الاختصارات، مؤشرات الأداء، ومسارات العمل حسب صلاحيات المستخدم دون كشف بيانات مالية أو إدارية غير لازمة.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof Building2; label: string }) {
  return (
    <Link href={href} className="rounded-lg border border-[var(--fi-line)] bg-white/[0.04] px-4 py-3 text-center transition hover:bg-white/[0.08]">
      <Icon className="mx-auto size-5 text-[var(--fi-gold)]" />
      <span className="mt-2 block text-xs font-black text-white">{label}</span>
    </Link>
  )
}

function PanelHeader({ title, action, href, icon: Icon = ArrowUpRight }: { title: string; action: string; href: string; icon?: typeof ArrowUpRight }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-black text-white">{title}</h3>
      <Link href={href} className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-black text-[var(--fi-gold)] transition hover:bg-white/[0.06]">
        {action}
        <Icon className="size-3.5" />
      </Link>
    </div>
  )
}

function MiniMetric({ icon: Icon, value, label }: { icon: typeof Clock; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <Icon className="size-4 text-[var(--fi-gold)]" />
      <p className="fi-tabular mt-3 text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}

function resolvePersona(role: string) {
  if (role === 'CLIENT' || role === 'client') return 'عميل'
  if (['broker', 'agent', 'freelancer'].includes(role)) return 'وسيط'
  if (['super_admin', 'platform_admin', 'admin', 'company_admin', 'company'].includes(role)) return 'إدارة'
  return 'فريق التشغيل'
}

function compactMoney(value: number) {
  if (!value) return '0 ج.م'
  return `${new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} ج.م`
}

function buildFeed(metrics: DashboardMetric, persona: string): FeedItem[] {
  return [
    {
      title: 'أولوية تشغيلية',
      message: metrics.pendingAds > 0 ? `${metrics.pendingAds} إعلان يحتاج مراجعة قبل النشر.` : 'لا توجد إعلانات معلقة حاليا.',
      tone: metrics.pendingAds > 0 ? 'gold' : 'success',
    },
    {
      title: 'تحليل المبيعات',
      message: metrics.freshLeads > 0 ? `${metrics.freshLeads} عميل جديد يحتاج توزيع أو متابعة.` : 'قائمة العملاء الجديدة مستقرة.',
      tone: 'info',
    },
    {
      title: `سطح ${persona}`,
      message: 'تم إخفاء التفاصيل المتقدمة غير المرتبطة بالدور الحالي لتقليل التشتيت.',
      tone: 'gold',
    },
  ]
}

function toneClass(tone: FeedItem['tone']) {
  const tones = {
    gold: 'bg-[var(--fi-gold)]',
    success: 'bg-[var(--fi-success)]',
    info: 'bg-[var(--fi-info)]',
    danger: 'bg-[var(--fi-danger)]',
  }

  return tones[tone]
}
