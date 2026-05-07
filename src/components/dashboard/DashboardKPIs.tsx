'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowDown, ArrowUp, Bot, Check, CircleDollarSign, Target, Users, WalletCards, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DashboardCharts } from './DashboardCharts'
import {
  RANGE_LABELS,
  type DashboardData,
  type DashboardQueryContext,
  type DashboardRange,
  useDashboardData,
} from './useDashboardData'
import { useCountUp } from '@/hooks/use-count-up'
import { useI18n } from '@/hooks/use-i18n'

type DashboardKPIsProps = {
  initialData: DashboardData
  context: DashboardQueryContext
}

export function DashboardKPIs({ initialData, context }: DashboardKPIsProps) {
  const { t, numLocale } = useI18n()
  const { data, range, setRange, isLoading, error, refresh } = useDashboardData(initialData, context)
  const [sheetAction, setSheetAction] = useState<{ label: string; href: string; icon: React.ElementType; description: string } | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => new Set())

  const QUICK_ACTIONS = [
    { label: t('عميل جديد', 'New Client'), href: '/dashboard/leads/new', icon: Users, description: t('إضافة عميل محتمل وربطه بالوسيط المناسب.', 'Add a potential client and link them to the right broker.') },
    { label: t('صفقة جديدة', 'New Deal'), href: '/dashboard/pipeline/new', icon: WalletCards, description: t('تسجيل فرصة بيع جديدة داخل خط المبيعات.', 'Register a new sales opportunity in the pipeline.') },
    { label: t('مهمة جديدة', 'New Task'), href: '/dashboard/tasks/new', icon: Check, description: t('إنشاء متابعة أو تذكير لفريق المبيعات.', 'Create a follow-up or reminder for the sales team.') },
  ]

  const formatMoney = (value: number) =>
    `${new Intl.NumberFormat(numLocale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)} ${t('ج.م', 'EGP')}`

  const visibleAlerts = useMemo(
    () => data.alerts.filter((alert) => !dismissedAlerts.has(alert.id)).slice(0, 3),
    [data.alerts, dismissedAlerts],
  )

  const cards = [
    {
      label: t('إجمالي العملاء', 'Total Clients'),
      value: data.kpis.totalClients.toLocaleString(numLocale),
      countValue: data.kpis.totalClients,
      suffix: '',
      detail: t('مقارنة بالفترة السابقة', 'Compared to previous period'),
      change: data.kpis.clientsChange,
      icon: Users,
    },
    {
      label: t('صفقات نشطة', 'Active Deals'),
      value: data.kpis.activeDeals.toLocaleString(numLocale),
      countValue: data.kpis.activeDeals,
      suffix: '',
      detail: t('داخل خط المبيعات', 'In the sales pipeline'),
      change: null,
      icon: Target,
    },
    {
      label: t('العمولات المستحقة', 'Pending Commissions'),
      value: formatMoney(data.kpis.pendingCommissions),
      countValue: null,
      suffix: '',
      detail: t('معلقة أو معتمدة', 'Pending or approved'),
      change: null,
      icon: CircleDollarSign,
    },
    {
      label: t('معدل التحويل', 'Conversion Rate'),
      value: `${data.kpis.conversionRate.toLocaleString(numLocale)}٪`,
      countValue: data.kpis.conversionRate,
      suffix: '٪',
      detail: t('من العملاء إلى صفقات', 'From clients to deals'),
      change: null,
      icon: WalletCards,
    },
  ]

  return (
    <section className="space-y-4" dir="rtl">
      <Card className="border-[var(--fi-line)] bg-white">
        <CardHeader className="gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <Badge className="bg-[var(--fi-soft)] text-[var(--fi-emerald)] hover:bg-[var(--fi-soft)]">FAST INVESTMENT CRM</Badge>
            <CardTitle className="mt-3 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">{t('لوحة القيادة التنفيذية', 'Executive Dashboard')}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl font-semibold leading-7 text-[var(--fi-muted)]">
              {t('مؤشرات المبيعات والعملاء والعمولات متصلة ببيانات Supabase الحية وتتغير حسب الفترة المختارة.', 'Sales, client, and commission indicators connected to live Supabase data and change based on the selected period.')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(RANGE_LABELS) as DashboardRange[]).map((key) => (
              <Button
                key={key}
                type="button"
                variant={range === key ? 'default' : 'outline'}
                className={range === key ? 'bg-[var(--fi-emerald)] text-white hover:bg-[var(--fi-emerald)]/90' : 'bg-white'}
                onClick={() => setRange(key)}
              >
                {RANGE_LABELS[key]}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.href}
                type="button"
                variant="outline"
                className="min-h-10 gap-2 bg-white font-black"
                onClick={() => setSheetAction(action)}
              >
                <action.icon className="size-4 text-[var(--fi-emerald)]" />
                {action.label}
              </Button>
            ))}
          </div>

          {error && (
            <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button type="button" variant="outline" className="bg-white" onClick={() => void refresh()}>
                {t('إعادة المحاولة', 'Retry')}
              </Button>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -2 }}
              >
              <Card className="ds-card-hover border-[var(--fi-line)] bg-[var(--fi-paper)]">
                <CardContent className="pt-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                      <card.icon className="size-5" />
                    </span>
                    {card.change !== null && <TrendBadge value={card.change} />}
                  </div>
                  <p className="fi-tabular mt-4 text-2xl font-black text-[var(--fi-ink)]">
                    {isLoading ? '...' : card.countValue === null ? card.value : <CountUpValue value={card.countValue} suffix={card.suffix} />}
                  </p>
                  <p className="mt-1 text-sm font-black text-[var(--fi-ink)]">{card.label}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--fi-muted)]">{card.detail}</p>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <DashboardCharts
            salesByMonth={data.salesByMonth}
            clientGrowth={data.clientGrowth}
            dealsByStage={data.dealsByStage}
            commissionsByMonth={data.commissionsByMonth}
            isLoading={isLoading}
          />
        </div>

        <Card className="border-[var(--fi-line)] bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                <Bot className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base font-black text-[var(--fi-ink)]">{t('تنبيهات الذكاء الاصطناعي', 'AI Alerts')}</CardTitle>
                <CardDescription className="font-semibold text-[var(--fi-muted)]">{t('أكثر 3 تنبيهات إلحاحا', 'Top 3 most urgent alerts')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleAlerts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] p-6 text-center text-sm font-bold text-[var(--fi-muted)]">
                {t('لا توجد تنبيهات عاجلة الآن', 'No urgent alerts right now')}
              </div>
            ) : visibleAlerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={alert.priority === 'critical' ? 'size-4 text-red-600' : 'size-4 text-amber-600'} />
                      <p className="text-sm font-black text-[var(--fi-ink)]">{alert.title}</p>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-6 text-[var(--fi-muted)]">{alert.body}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('إخفاء التنبيه', 'Dismiss alert')}
                    onClick={() => setDismissedAlerts((prev) => new Set(prev).add(alert.id))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <Link
                  href={alert.href}
                  className="mt-3 inline-flex h-8 items-center justify-center rounded-lg bg-[var(--fi-emerald)] px-3 text-xs font-black text-white transition hover:opacity-90"
                >
                  {alert.actionLabel}
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetAction !== null} onOpenChange={(open) => !open && setSheetAction(null)}>
        <SheetContent side="left" className="w-full max-w-md bg-white" dir="rtl">
          {sheetAction && (
            <>
              <SheetHeader>
                <SheetTitle className="text-right text-xl font-black text-[var(--fi-ink)]">{sheetAction.label}</SheetTitle>
                <SheetDescription className="text-right font-semibold leading-7 text-[var(--fi-muted)]">
                  {sheetAction.description}
                </SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
                  {t('هذه النسخة تفتح المسار المخصص داخل لوحة التحكم. يمكن لاحقا استبدال المحتوى هنا بنموذج مضمن دون تغيير تجربة المستخدم.', 'This version opens the dedicated path inside the dashboard. Content can later be replaced with an embedded form without changing the user experience.')}
                </div>
                <Link
                  href={sheetAction.href}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--fi-emerald)] px-4 text-sm font-black text-white"
                >
                  {t('فتح', 'Open')} {sheetAction.label}
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

function TrendBadge({ value }: { value: number }) {
  const { numLocale } = useI18n()
  const isUp = value >= 0

  return (
    <span className={isUp ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700' : 'inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-700'}>
      {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(value).toLocaleString(numLocale)}٪
    </span>
  )
}

function CountUpValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const { numLocale } = useI18n()
  const current = useCountUp(value)
  return <>{current.toLocaleString(numLocale)}{suffix}</>
}
