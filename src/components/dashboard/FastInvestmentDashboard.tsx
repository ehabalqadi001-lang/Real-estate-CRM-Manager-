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
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

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
  const { t, numLocale } = useI18n()

  function compactMoney(value: number) {
    if (!value) return `0 ${t('ج.م', 'EGP')}`
    return `${new Intl.NumberFormat(numLocale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)} ${t('ج.م', 'EGP')}`
  }

  function resolvePersona(role: string) {
    if (role === 'CLIENT' || role === 'client') return t('عميل', 'Client')
    if (['broker', 'agent', 'freelancer'].includes(role)) return t('وسيط', 'Broker')
    if (['super_admin', 'platform_admin', 'admin', 'company_admin', 'company'].includes(role)) return t('إدارة', 'Management')
    return t('فريق التشغيل', 'Operations Team')
  }

  function buildFeed(m: DashboardMetric, persona: string): FeedItem[] {
    return [
      {
        title: t('أولوية تشغيلية', 'Operational Priority'),
        message: m.pendingAds > 0
          ? `${m.pendingAds} ${t('إعلان يحتاج مراجعة قبل النشر.', 'ad(s) need review before publishing.')}`
          : t('لا توجد إعلانات معلقة حاليًا.', 'No pending ads at the moment.'),
        tone: m.pendingAds > 0 ? 'primary' : 'success',
      },
      {
        title: t('تحليل المبيعات', 'Sales Analysis'),
        message: m.freshLeads > 0
          ? `${m.freshLeads} ${t('عميل جديد يحتاج توزيع أو متابعة.', 'new lead(s) need assignment or follow-up.')}`
          : t('قائمة العملاء الجديدة مستقرة.', 'New leads list is stable.'),
        tone: 'info',
      },
      {
        title: `${t('سطح', 'Surface')} ${persona}`,
        message: t(
          'تم إخفاء التفاصيل المتقدمة غير المرتبطة بالدور الحالي لتقليل الحمل البصري.',
          'Advanced details unrelated to your current role are hidden to reduce visual clutter.'
        ),
        tone: 'primary',
      },
    ]
  }

  const persona = resolvePersona(metrics.role)
  const conversion = metrics.totalLeads ? Math.round((metrics.wonDeals / metrics.totalLeads) * 100) : 0
  const feed = buildFeed(metrics, persona)

  const cards = [
    {
      label: t('إجمالي العملاء', 'Total Leads'),
      value: metrics.totalLeads.toLocaleString(numLocale),
      detail: `${metrics.freshLeads.toLocaleString(numLocale)} ${t('جديد', 'new')}`,
      icon: Users,
      href: '/dashboard/leads',
      color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
      trend: '+12%',
      up: true,
    },
    {
      label: t('قيمة التداول', 'Trading Value'),
      value: compactMoney(metrics.revenue),
      detail: `${metrics.wonDeals.toLocaleString(numLocale)} ${t('صفقة رابحة', 'won deal(s)')}`,
      icon: CircleDollarSign,
      href: '/dashboard/deals',
      color: 'text-[var(--fi-emerald)] bg-[var(--fi-soft)] dark:bg-emerald-900/20',
      trend: '+8%',
      up: true,
    },
    {
      label: t('معدل التحويل', 'Conversion Rate'),
      value: `${conversion}%`,
      detail: t('من عميل إلى صفقة', 'Lead to deal'),
      icon: Target,
      href: '/dashboard/analytics',
      color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
      trend: conversion > 10 ? '+' : '',
      up: conversion > 10,
    },
    {
      label: t('إعلانات للمراجعة', 'Ads for Review'),
      value: metrics.pendingAds.toLocaleString(numLocale),
      detail: 'FAST INVESTMENT',
      icon: ShieldCheck,
      href: '/admin/ad-approvals',
      color: metrics.pendingAds > 0
        ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20'
        : 'text-[var(--fi-emerald)] bg-[var(--fi-soft)] dark:bg-emerald-900/20',
      trend: metrics.pendingAds > 0 ? `${metrics.pendingAds} ${t('معلق', 'pending')}` : t('مكتمل', 'Complete'),
      up: metrics.pendingAds === 0,
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
        {/* Hero panel */}
        <div className="fi-card col-span-12 overflow-hidden p-4 sm:p-6 lg:col-span-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--fi-soft)] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[var(--fi-emerald)]">
                <TrendingUp className="size-3" aria-hidden="true" />
                FAST INVESTMENT
              </span>
              <h2 className="mt-3 text-2xl font-black leading-tight text-[var(--fi-ink)] sm:text-3xl">
                {t('لوحة القيادة التنفيذية', 'Executive Dashboard')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-[var(--fi-muted)]">
                {t('مرحباً،', 'Welcome,')} <strong className="text-[var(--fi-ink)]">{metrics.name}</strong> — {t('الواجهة مُعدّة لدور', 'interface configured for role')}{' '}
                <strong className="text-[var(--fi-emerald)]">{persona}</strong>. {t('المؤشرات الأساسية أولاً.', 'Key indicators first.')}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <QuickAction href="/dashboard/deals/kanban" icon={WalletCards} label="Pipeline" />
              <QuickAction href="/marketplace" icon={Building2} label="Marketplace" />
            </div>
          </div>

          {/* KPI cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.22 }}
              >
                <Link
                  href={card.href}
                  className="group flex min-h-[144px] flex-col justify-between rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--fi-emerald)] hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className={`flex size-10 items-center justify-center rounded-xl ${card.color}`} aria-hidden="true">
                      <card.icon className="size-5" />
                    </span>
                    <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${card.up ? 'fi-badge-up' : 'fi-badge-down'}`}>
                      {card.up ? '↑' : '↓'} {card.trend}
                    </span>
                  </div>
                  <div>
                    <p className="fi-tabular mt-3 text-2xl font-black text-[var(--fi-ink)]">{card.value}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--fi-muted)]">{card.label}</p>
                    <p className="mt-1.5 text-[11px] font-bold text-[var(--fi-emerald)]">{card.detail}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Feed */}
        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[var(--fi-ink)]">AI Activity Feed</p>
              <p className="mt-0.5 text-xs font-medium text-[var(--fi-muted)]">{t('إشارات تشغيلية حسب الأولوية', 'Operational signals by priority')}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-soft)] text-[var(--fi-emerald)]" aria-hidden="true">
              <Bot className="size-5" />
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {feed.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3.5"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${toneClass(item.tone)}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--fi-ink)]">{item.title}</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--fi-muted)]">{item.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Conversion progress */}
          <div className="mt-5 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[var(--fi-ink)]">{t('معدل التحويل الكلي', 'Overall Conversion Rate')}</span>
              <span className="text-[var(--fi-emerald)]">{conversion}%</span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--fi-line)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--fi-emerald)] to-[var(--fi-emerald-2)] transition-all duration-700"
                style={{ width: `${Math.min(conversion, 100)}%` }}
                role="progressbar"
                aria-valuenow={conversion}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-7">
          <PanelHeader title="Revenue Intelligence" action={t('تفاصيل مالية', 'Financial Details')} href="/dashboard/finance" />
          <div className="mt-5 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="emeraldRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#27AE60" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#27AE60" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--fi-line)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="var(--fi-muted)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--fi-muted)" tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v) / 1_000_000}M`} width={42} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--fi-paper)',
                    border: '1px solid var(--fi-line)',
                    borderRadius: 10,
                    color: 'var(--fi-ink)',
                    boxShadow: '0 12px 30px rgba(23,32,42,.10)',
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#27AE60" strokeWidth={2.5} fill="url(#emeraldRevenue)" dot={false} activeDot={{ r: 4, fill: '#27AE60' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline density */}
        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-5">
          <PanelHeader title="Pipeline Density" action="Kanban" href="/dashboard/deals/kanban" />
          <div className="mt-5 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid stroke="var(--fi-line)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="var(--fi-muted)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--fi-muted)" tickLine={false} axisLine={false} width={34} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--fi-paper)',
                    border: '1px solid var(--fi-line)',
                    borderRadius: 10,
                    color: 'var(--fi-ink)',
                    boxShadow: '0 12px 30px rgba(23,32,42,.10)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="leads" fill="#3498DB" radius={[6, 6, 0, 0]} name={t('عملاء', 'Leads')} />
                <Bar dataKey="deals" fill="#27AE60" radius={[6, 6, 0, 0]} name={t('صفقات', 'Deals')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick filters */}
        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-4">
          <PanelHeader title={t('تصفية سريعة', 'Quick Filters')} action={t('فتح الفلاتر', 'Open Filters')} href="/dashboard/leads" icon={Filter} />
          <div className="mt-5 space-y-2.5">
            {[
              { label: t('الفترة الزمنية', 'Time Period'), href: '/dashboard/leads' },
              { label: t('مصدر العميل', 'Lead Source'), href: '/dashboard/leads' },
              { label: t('مرحلة الصفقة', 'Deal Stage'), href: '/dashboard/deals' },
              { label: t('الوسيط المسؤول', 'Responsible Broker'), href: '/dashboard/brokers' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3.5 py-3 text-sm font-medium text-[var(--fi-muted)] transition-all duration-150 hover:border-[var(--fi-emerald)] hover:text-[var(--fi-ink)] cursor-pointer"
              >
                {item.label}
                <ArrowUpRight className="size-4 shrink-0 text-[var(--fi-muted)]" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        {/* Team SLA */}
        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-4">
          <PanelHeader title="Team SLA" action={t('خدمة العملاء', 'Customer Service')} href="/admin/customer-service" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniMetric icon={Clock} value="14m" label={t('متوسط الاستجابة', 'Avg Response')} />
            <MiniMetric icon={BellRing} value={metrics.unreadNotifications.toLocaleString(numLocale)} label={t('تنبيهات غير مقروءة', 'Unread Notifications')} />
            <MiniMetric icon={ShieldCheck} value={metrics.pendingAds.toLocaleString(numLocale)} label={t('اعتمادات معلقة', 'Pending Approvals')} />
            <MiniMetric icon={Sparkles} value="AI" label={t('تغذية ذكية', 'Smart Feed')} />
          </div>
        </div>

        {/* Role surface */}
        <div className="fi-card col-span-12 p-4 sm:p-5 lg:col-span-4">
          <PanelHeader title="Role Surface" action={persona} href="/dashboard/settings" />
          <div className="mt-5 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--fi-emerald)]" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-[var(--fi-ink)]">{t('مخصص لدور:', 'Configured for role:')} {persona}</p>
                <p className="mt-2 text-xs font-medium leading-6 text-[var(--fi-muted)]">
                  {t(
                    'يتم ضبط الاختصارات والمؤشرات حسب صلاحيات المستخدم، مع إخفاء البيانات غير الضرورية لتقليل التشتيت.',
                    'Shortcuts and indicators are adjusted based on user permissions, hiding unnecessary data to reduce distraction.'
                  )}
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
    <Link
      href={href}
      className="flex min-h-[44px] min-w-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-4 py-3 shadow-sm transition-all duration-150 hover:border-[var(--fi-emerald)] hover:shadow-md cursor-pointer"
    >
      <Icon className="size-5 text-[var(--fi-emerald)]" aria-hidden="true" />
      <span className="text-xs font-bold text-[var(--fi-ink)]">{label}</span>
    </Link>
  )
}

function PanelHeader({ title, action, href, icon: Icon = ArrowUpRight }: { title: string; action: string; href: string; icon?: LucideIcon }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-bold text-[var(--fi-ink)]">{title}</h3>
      <Link
        href={href}
        className="flex min-h-9 items-center gap-1 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-1.5 text-xs font-bold text-[var(--fi-emerald)] transition-all duration-150 hover:bg-[var(--fi-soft)] cursor-pointer"
      >
        {action}
        <Icon className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  )
}

function MiniMetric({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3">
      <Icon className="size-4 text-[var(--fi-emerald)]" aria-hidden="true" />
      <p className="fi-tabular mt-2.5 text-xl font-black text-[var(--fi-ink)]">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}

function toneClass(tone: FeedItem['tone']) {
  return {
    primary: 'bg-[var(--fi-emerald)]',
    success: 'bg-emerald-500',
    info: 'bg-[var(--fi-blue)]',
    danger: 'bg-[var(--fi-danger)]',
  }[tone]
}
