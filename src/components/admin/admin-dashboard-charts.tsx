'use client'

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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

const formatNumber = (value: number) => new Intl.NumberFormat('ar-EG', { notation: 'compact' }).format(value)

export function AdminDashboardCharts({
  signups,
  citySales,
  companyGmv,
}: {
  signups: SignupPoint[]
  citySales: CitySalesPoint[]
  companyGmv: CompanyGmvPoint[]
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="نمو المستخدمين - آخر ٣٠ يوم">
        <LineChart data={signups}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatNumber} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => new Intl.NumberFormat('ar-EG').format(Number(value))} />
          <Line type="monotone" dataKey="users" stroke="var(--fi-emerald)" strokeWidth={3} dot={false} />
        </LineChart>
      </ChartCard>

      <ChartCard title="المبيعات حسب المحافظة">
        <BarChart data={citySales}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="city" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatNumber} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => `${formatNumber(Number(value))} ج.م`} />
          <Bar dataKey="gmv" fill="var(--fi-emerald)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartCard>

      <div className="xl:col-span-2">
        <ChartCard title="أفضل ١٠ شركات وساطة حسب GMV">
          <BarChart data={companyGmv} layout="vertical" margin={{ left: 30, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatNumber} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="company" width={160} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => `${formatNumber(Number(value))} ج.م`} />
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
