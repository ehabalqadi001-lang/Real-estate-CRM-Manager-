'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'

interface MonthlyData {
  month: string
  deals: number
  revenue: number
  leads: number
}

interface Props {
  monthlyData: MonthlyData[]
  forecast: MonthlyData[]
}

export default function ForecastChart({ monthlyData, forecast }: Props) {
  const combined = [
    ...monthlyData.map(d => ({ ...d, type: 'actual' })),
    ...forecast.map(d => ({ ...d, type: 'forecast' })),
  ]

  const splitIndex = monthlyData.length - 1
  const splitMonth = combined[splitIndex]?.month

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800 mb-1">الإيرادات الشهرية + التوقعات</h2>
      <p className="text-xs text-slate-400 mb-5">الأعمدة = إيراد فعلي | الخط = صفقات | المنطقة المعلمة = توقعات</p>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combined} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="revenue" axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`} />
            <YAxis yAxisId="deals" orientation="left" axisLine={false} tickLine={false} hide />
            <Tooltip
              formatter={(value, name) => {
                const num = Number(value)
                if (name === 'إيراد') return [`${(num / 1_000_000).toFixed(2)}M ج.م`, name]
                return [num, String(name)]
              }}
            />
            <Legend />
            {splitMonth && (
              <ReferenceLine x={splitMonth} yAxisId="revenue" stroke="#94a3b8"
                strokeDasharray="4 4" label={{ value: 'توقعات ▶', position: 'top', fontSize: 10, fill: '#94a3b8' }} />
            )}
            <Bar yAxisId="revenue" dataKey="revenue" name="إيراد" fill="#3b82f6" radius={[4, 4, 0, 0]}
              fillOpacity={combined.map(d => d.type === 'forecast' ? 0.4 : 1) as unknown as number} />
            <Line yAxisId="deals" dataKey="deals" name="صفقات" stroke="#10b981"
              strokeWidth={2} dot={{ r: 3 }} strokeDasharray="0" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
