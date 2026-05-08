'use client'

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useI18n } from '@/hooks/use-i18n'

export interface SignupPoint {
  day: string
  users: number
}

export interface CitySalesPoint {
  city: string
  gmv: number
}

export interface CompanyGmvPoint {
  company: string
  gmv: number
}

export function AdminDashboardCharts({
  signups,
  citySales,
  companyGmv,
}: {
  signups: SignupPoint[]
  citySales: CitySalesPoint[]
  companyGmv: CompanyGmvPoint[]
}) {
  const { t, numLocale } = useI18n()

  const formatNumber = (value: number) => new Intl.NumberFormat(numLocale, { notation: 'compact' }).format(value)

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title={t('نمو المستخدمين - آخر ٣٠ يوم', 'User Growth - Last 30 Days')}>
        <LineChart data={signups}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatNumber} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => new Intl.NumberFormat(numLocale).format(Number(value))} />
          <Line type="monotone" dataKey="users" stroke="var(--fi-emerald)" strokeWidth={3} dot={false} />
        </LineChart>
      </ChartCard>

      <ChartCard title={t('المبيعات حسب المحافظة', 'Sales by Governorate')}>
        <BarChart data={citySales}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="city" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatNumber} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => `${formatNumber(Number(value))} ${t('ج.م', 'EGP')}`} />
          <Bar dataKey="gmv" fill="var(--fi-emerald)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartCard>

      <div className="xl:col-span-2">
        <ChartCard title={t('أفضل ١٠ شركات وساطة حسب GMV', 'Top 10 Brokerage Companies by GMV')}>
          <BarChart data={companyGmv} layout="vertical" margin={{ left: 30, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatNumber} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="company" width={160} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => `${formatNumber(Number(value))} ${t('ج.م', 'EGP')}`} />
            <Bar dataKey="gmv" fill="var(--fi-ink)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <section className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
      <h2 className="mb-4 font-black text-[var(--fi-ink)]">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  )
}
