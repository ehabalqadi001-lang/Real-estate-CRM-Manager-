'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
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

type DashboardKPIsProps = {
  initialData: DashboardData
  context: DashboardQueryContext
}

const QUICK_ACTIONS = [
  { label: 'عميل جديد', href: '/dashboard/leads/new', icon: Users, description: 'إضافة عميل محتمل وربطه بالوسيط المناسب.' },
  { label: 'صفقة جديدة', href: '/dashboard/pipeline/new', icon: WalletCards, description: 'تسجيل فرصة بيع جديدة داخل خط المبيعات.' },
  { label: 'مهمة جديدة', href: '/dashboard/tasks/new', icon: Check, description: 'إنشاء متابعة أو تذكير لفريق المبيعات.' },
]

export function DashboardKPIs({ initialData, context }: DashboardKPIsProps) {
  const { data, range, setRange, isLoading, error, refresh } = useDashboardData(initialData, context)
  const [sheetAction, setSheetAction] = useState<(typeof QUICK_ACTIONS)[number] | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => new Set())

  const visibleAlerts = useMemo(
    () => data.alerts.filter((alert) => !dismissedAlerts.has(alert.id)).slice(0, 3),
    [data.alerts, dismissedAlerts],
  )

  const cards = [
    {
      label: 'إجمالي العملاء',
      value: data.kpis.totalClients.toLocaleString('ar-EG'),
      detail: 'مقارنة بالفترة السابقة',
      change: data.kpis.clientsChange,
      icon: Users,
    },
    {
      label: 'صفقات نشطة',
      value: data.kpis.activeDeals.toLocaleString('ar-EG'),
      detail: 'داخل خط المبيعات',
      change: null,
      icon: Target,
    },
    {
      label: 'العمولات المستحقة',
      value: formatMoney(data.kpis.pendingCommissions),
      detail: 'معلقة أو معتمدة',
      change: null,
      icon: CircleDollarSign,
    },
    {
      label: 'معدل التحويل',
      value: `${data.kpis.conversionRate.toLocaleString('ar-EG')}٪`,
      detail: 'من العملاء إلى صفقات',
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
            <CardTitle className="mt-3 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">لوحة القيادة التنفيذية</CardTitle>
            <CardDescription className="mt-2 max-w-2xl font-semibold leading-7 text-[var(--fi-muted)]">
              مؤشرات المبيعات والعملاء والعمولات متصلة ببيانات Supabase الحية وتتغير حسب الفترة المختارة.
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
                إعادة المحاولة
              </Button>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.label} className="border-[var(--fi-line)] bg-[var(--fi-paper)]">
                <CardContent className="pt-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                      <card.icon className="size-5" />
                    </span>
                    {card.change !== null && <TrendBadge value={card.change} />}
                  </div>
                  <p className="fi-tabular mt-4 text-2xl font-black text-[var(--fi-ink)]">{isLoading ? '...' : card.value}</p>
                  <p className="mt-1 text-sm font-black text-[var(--fi-ink)]">{card.label}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--fi-muted)]">{card.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
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
                <CardTitle className="text-base font-black text-[var(--fi-ink)]">تنبيهات الذكاء الاصطناعي</CardTitle>
                <CardDescription className="font-semibold text-[var(--fi-muted)]">أكثر 3 تنبيهات إلحاحا</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleAlerts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] p-6 text-center text-sm font-bold text-[var(--fi-muted)]">
                لا توجد تنبيهات عاجلة الآن
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
                    aria-label="إخفاء التنبيه"
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
                  هذه النسخة تفتح المسار المخصص داخل لوحة التحكم. يمكن لاحقا استبدال المحتوى هنا بنموذج مضمن دون تغيير تجربة المستخدم.
                </div>
                <Link
                  href={sheetAction.href}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--fi-emerald)] px-4 text-sm font-black text-white"
                >
                  فتح {sheetAction.label}
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
  const isUp = value >= 0

  return (
    <span className={isUp ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700' : 'inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-700'}>
      {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(value).toLocaleString('ar-EG')}٪
    </span>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} ج.م`
}
