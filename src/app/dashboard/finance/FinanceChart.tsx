'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { month: string; revenue: number }[]
}

export default function FinanceChart({ data }: Props) {
  if (!data.length) return (
    <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
      لا توجد بيانات بعد
    </div>
  )

  const fmt = (v: number) =>
    new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(v)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(v) => [`${fmt(Number(v ?? 0))} ج.م`, 'الإيراد']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
