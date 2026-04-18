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
import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpRight,
  BellRing,
  Bot,
  Building2,
  CheckCircle2,
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
  tone: 'primary' | 'success' | 'info' | 'danger'
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
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fi-bento-grid"
      >
        <div className="fi-card col-span-12 overflow-hidden p-4 sm:p-5 lg:col-span-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--fi-emerald)]">FAST INVESTMENT</p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-[var(--fi-ink)] sm:text-3xl">لوحة القيادة التنفيذية</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
                واجهة تشغيل هادئة ومركزة تتكيف مع دورك الحالي: {persona}. المؤشرات الأساسية تظهر أولًا، والتفاصيل المتقدمة تبقى قريبة عند الحاجة.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <QuickAction href="/dashboard/deals/kanban" icon={WalletCards} label="Pipeline" />
              <QuickAction href="/marketplace" icon={Building2} label="Marketplace" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.22 }}
              >
                <Link href={card.href} className="block min-h-[144px] rounded-lg border border-[var(--fi-line)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--fi-emerald)] hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                      <card.icon className="size-5" />
                    </span>
                    <ArrowUpRight className="size-4 text-[var(--fi-muted)]" />
                  </div>
                  <p className="fi-tabular mt-4 text-2xl font-black text-[var(--fi-ink)]">{card.value}</p>
                  <p className="mt-1 text-xs font-black text-[var(--fi-muted)]">{card.label}</p>
                  <p className="mt-2 text-[11px] font-bold text-[var(--fi-emerald)]">{card.detail}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[var(--fi-ink)]">AI Activity Feed</p>
              <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">إشارات تشغيلية حسب الأولوية</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
              <Bot className="size-5" />
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {feed.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.04 }}
                className="rounded-lg border border-[var(--fi-line)] bg-white p-3"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 size-2 rounded-full ${toneClass(item.tone)}`} />
                  <div>
                    <p className="text-sm font-black text-[var(--fi-ink)]">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[var(--fi-muted)]">{item.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-7">
          <PanelHeader title="Revenue Intelligence" action="تفاصيل مالية" href="/dashboard/finance" />
          <div className="mt-5 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="emeraldRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#27AE60" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="#27AE60" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E4ECE7" vertical={false} />
                <XAxis dataKey="label" stroke="#667085" tickLine={false} axisLine={false} />
                <YAxis stroke="#667085" tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1_000_000}M`} width={42} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E4ECE7', borderRadius: 8, color: '#17202A', boxShadow: '0 12px 30px rgba(23,32,42,.08)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#27AE60" strokeWidth={3} fill="url(#emeraldRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-5">
          <PanelHeader title="Pipeline Density" action="Kanban" href="/dashboard/deals/kanban" />
          <div className="mt-5 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#E4ECE7" vertical={false} />
                <XAxis dataKey="label" stroke="#667085" tickLine={false} axisLine={false} />
                <YAxis stroke="#667085" tickLine={false} axisLine={false} width={34} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E4ECE7', borderRadius: 8, color: '#17202A', boxShadow: '0 12px 30px rgba(23,32,42,.08)' }} />
                <Bar dataKey="leads" fill="#3498DB" radius={[8, 8, 0, 0]} />
                <Bar dataKey="deals" fill="#27AE60" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-4">
          <PanelHeader title="Progressive Filters" action="فتح الفلاتر" href="/dashboard/leads" icon={Filter} />
          <div className="mt-5 space-y-3">
            {['الفترة الزمنية', 'مصدر العميل', 'مرحلة الصفقة', 'الوسيط المسؤول'].map((item) => (
              <button key={item} className="flex min-h-11 w-full items-center justify-between rounded-lg border border-[var(--fi-line)] bg-white px-3 py-3 text-sm font-bold text-[var(--fi-muted)] transition hover:border-[var(--fi-emerald)] hover:text-[var(--fi-ink)]">
                {item}
                <ArrowUpRight className="size-4 text-[var(--fi-muted)]" />
              </button>
            ))}
          </div>
        </div>

        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-4">
          <PanelHeader title="Team SLA" action="خدمة العملاء" href="/admin/customer-service" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniMetric icon={Clock} value="14m" label="متوسط الاستجابة" />
            <MiniMetric icon={BellRing} value={metrics.unreadNotifications.toLocaleString('ar-EG')} label="تنبيهات غير مقروءة" />
            <MiniMetric icon={ShieldCheck} value={metrics.pendingAds.toLocaleString('ar-EG')} label="اعتمادات معلقة" />
            <MiniMetric icon={Sparkles} value="AI" label="تغذية ذكية" />
          </div>
        </div>

        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-4">
          <PanelHeader title="Role Surface" action={persona} href="/dashboard/settings" />
          <div className="mt-5 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--fi-emerald)]" />
              <div>
                <p className="text-sm font-black text-[var(--fi-ink)]">الواجهة الحالية مخصصة لدور: {persona}</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-[var(--fi-muted)]">
                  يتم ضبط الاختصارات والمؤشرات ومسارات العمل حسب صلاحيات المستخدم، مع إخفاء البيانات المتقدمة غير الضرورية لتقليل التشتيت.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="rounded-lg border border-[var(--fi-line)] bg-white px-4 py-3 text-center shadow-sm transition hover:border-[var(--fi-emerald)]">
      <Icon className="mx-auto size-5 text-[var(--fi-emerald)]" />
      <span className="mt-2 block text-xs font-black text-[var(--fi-ink)]">{label}</span>
    </Link>
  )
}

function PanelHeader({ title, action, href, icon: Icon = ArrowUpRight }: { title: string; action: string; href: string; icon?: LucideIcon }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-black text-[var(--fi-ink)]">{title}</h3>
      <Link href={href} className="flex min-h-9 items-center gap-1 rounded-lg border border-[var(--fi-line)] bg-white px-2.5 py-1.5 text-xs font-black text-[var(--fi-emerald)] transition hover:bg-[var(--fi-soft)]">
        {action}
        <Icon className="size-3.5" />
      </Link>
    </div>
  )
}

function MiniMetric({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-white p-3">
      <Icon className="size-4 text-[var(--fi-emerald)]" />
      <p className="fi-tabular mt-3 text-xl font-black text-[var(--fi-ink)]">{value}</p>
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
      message: metrics.pendingAds > 0 ? `${metrics.pendingAds} إعلان يحتاج مراجعة قبل النشر.` : 'لا توجد إعلانات معلقة حاليًا.',
      tone: metrics.pendingAds > 0 ? 'primary' : 'success',
    },
    {
      title: 'تحليل المبيعات',
      message: metrics.freshLeads > 0 ? `${metrics.freshLeads} عميل جديد يحتاج توزيع أو متابعة.` : 'قائمة العملاء الجديدة مستقرة.',
      tone: 'info',
    },
    {
      title: `سطح ${persona}`,
      message: 'تم إخفاء التفاصيل المتقدمة غير المرتبطة بالدور الحالي لتقليل الحمل البصري وتحسين سرعة القرار.',
      tone: 'primary',
    },
  ]
}

function toneClass(tone: FeedItem['tone']) {
  const tones = {
    primary: 'bg-[var(--fi-emerald)]',
    success: 'bg-[var(--fi-success)]',
    info: 'bg-[var(--fi-info)]',
    danger: 'bg-[var(--fi-danger)]',
  }

  return tones[tone]
}
