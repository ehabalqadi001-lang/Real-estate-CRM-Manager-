'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { month: string; revenue: number }[]
}

export default function ExecutiveMiniChart({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800">الإيراد الشهري (آخر 6 أشهر)</h3>
        <p className="text-xs text-slate-400">الصفقات المبرمة فعلياً</p>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`} />
            <Tooltip
              formatter={(value) => { const num = Number(value); return [`${(num / 1_000_000).toFixed(2)}M ج.م`, 'الإيراد'] }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2}
              fill="url(#execGrad)" dot={{ r: 3, fill: '#3b82f6' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
