'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChartPoint, StagePoint } from './useDashboardData'
import { useI18n } from '@/hooks/use-i18n'

type DashboardChartsProps = {
  salesByMonth: ChartPoint[]
  clientGrowth: ChartPoint[]
  dealsByStage: StagePoint[]
  commissionsByMonth: ChartPoint[]
  isLoading?: boolean
}

const COLORS = [
  'var(--fi-emerald)',
  'var(--fi-blue)',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#22c55e',
  '#ef4444',
]

export function DashboardCharts({
  salesByMonth,
  clientGrowth,
  dealsByStage,
  commissionsByMonth,
  isLoading = false,
}: DashboardChartsProps) {
  const { t, numLocale } = useI18n()

  function compactAxis(value: number) {
    return new Intl.NumberFormat(numLocale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 2xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="min-h-[340px] min-w-0 border-[var(--fi-line)] bg-white">
            <CardHeader>
              <div className="h-5 w-36 animate-pulse rounded bg-[var(--fi-line)]" />
              <div className="h-4 w-52 animate-pulse rounded bg-[var(--fi-line)]" />
            </CardHeader>
            <CardContent>
              <div className="h-56 animate-pulse rounded-lg bg-[var(--fi-soft)]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 2xl:grid-cols-2">
      <ChartCard title={t('المبيعات الشهرية', 'Monthly Sales')} description={t('آخر 6 أشهر حسب الصفقات المغلقة', 'Last 6 months by closed deals')}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={salesByMonth} margin={{ top: 8, right: 10, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="var(--fi-line)" vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="var(--fi-muted)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--fi-muted)" tickLine={false} axisLine={false} tickFormatter={compactAxis} width={52} tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip valueLabel={t('ج.م', 'EGP')} numLocale={numLocale} />} />
            <Bar dataKey="sales" name={t('المبيعات', 'Sales')} fill="var(--fi-emerald)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('نمو العملاء', 'Client Growth')} description={t('النمو التراكمي للعملاء خلال الفترة', 'Cumulative client growth over the period')}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={clientGrowth} margin={{ top: 8, right: 10, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="var(--fi-line)" vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="var(--fi-muted)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--fi-muted)" tickLine={false} axisLine={false} width={42} tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip numLocale={numLocale} />} />
            <Line type="monotone" dataKey="cumulativeClients" name={t('العملاء', 'Clients')} stroke="var(--fi-blue)" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('حالة الصفقات', 'Deal Status')} description={t('توزيع الصفقات حسب المرحلة الحالية', 'Deal distribution by current stage')}>
        {dealsByStage.some((stage) => stage.count > 0) ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={dealsByStage}
                dataKey="count"
                nameKey="stage"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
                labelLine={false}
              >
                {dealsByStage.map((entry, index) => (
                  <Cell key={entry.stage} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip numLocale={numLocale} />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label={t('لا توجد صفقات في هذه الفترة', 'No deals in this period')} />
        )}
      </ChartCard>

      <ChartCard title={t('العمولات', 'Commissions')} description={t('العمولات المعتمدة أو المدفوعة شهرياً', 'Approved or paid commissions monthly')}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={commissionsByMonth} margin={{ top: 8, right: 10, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="commissionFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--fi-emerald)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--fi-emerald)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--fi-line)" vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="var(--fi-muted)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--fi-muted)" tickLine={false} axisLine={false} tickFormatter={compactAxis} width={52} tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip valueLabel={t('ج.م', 'EGP')} numLocale={numLocale} />} />
            <Area type="monotone" dataKey="commissions" name={t('العمولات', 'Commissions')} stroke="var(--fi-emerald)" strokeWidth={3} fill="url(#commissionFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="min-h-[340px] min-w-0 border-[var(--fi-line)] bg-white">
      <CardHeader>
        <CardTitle className="text-base font-black text-[var(--fi-ink)]">{title}</CardTitle>
        <CardDescription className="font-semibold text-[var(--fi-muted)]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">{children}</CardContent>
    </Card>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] text-sm font-bold text-[var(--fi-muted)]">
      {label}
    </div>
  )
}

function ChartTooltip({ active, payload, label, valueLabel, numLocale }: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; payload?: { stage?: string } }>
  label?: string
  valueLabel?: string
  numLocale: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2 text-right text-xs shadow-xl" dir="rtl">
      {label && <p className="mb-1 font-black text-[var(--fi-ink)]">{label}</p>}
      {payload.map((item) => (
        <p key={`${item.name}-${item.value}`} className="font-bold text-[var(--fi-muted)]">
          {item.name ?? item.payload?.stage}: {Number(item.value ?? 0).toLocaleString(numLocale)} {valueLabel ?? ''}
        </p>
      ))}
    </div>
  )
}
