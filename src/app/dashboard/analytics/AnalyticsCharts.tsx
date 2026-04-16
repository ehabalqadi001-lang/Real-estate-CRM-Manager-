'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Line,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'

interface Props {
  funnelData:   { stage: string; count: number }[]
  sourceData:   { name: string; value: number }[]
  lostReasons:  { reason: string; count: number }[]
  monthlyTrend: { month: string; leads: number; revenue: number }[]
  stageData:    { name: string; value: number }[]
}

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

const fmtRevenue = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`

export default function AnalyticsCharts({ funnelData, sourceData, lostReasons, monthlyTrend, stageData }: Props) {
  return (
    <div className="space-y-6">
      {/* Row 1: Funnel + Monthly trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-black text-slate-800 text-sm mb-4">قمع المبيعات</h2>
          <div className="space-y-2">
            {funnelData.map((s, i) => {
              const maxCount = Math.max(...funnelData.map(d => d.count), 1)
              const pct = Math.round((s.count / maxCount) * 100)
              const colors = ['bg-blue-500','bg-teal-500','bg-yellow-500','bg-orange-500','bg-emerald-500','bg-red-500']
              return (
                <div key={s.stage}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">{s.stage}</span>
                    <span className="text-slate-900">{s.count}</span>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div className={`h-full ${colors[i]} rounded-lg transition-all flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(pct, 4)}%` }}>
                      {pct > 15 && <span className="text-[10px] text-white font-bold">{pct}%</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-black text-slate-800 text-sm mb-4">الاتجاه الشهري (عملاء + إيراد)</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10 }}
                  tickFormatter={fmtRevenue} />
                <Tooltip formatter={(v, name) => {
                  const num = Number(v)
                  if (name === 'إيراد') return [fmtRevenue(num) + ' ج.م', name]
                  return [num, name]
                }} />
                <Bar yAxisId="left" dataKey="leads" name="عملاء" fill="#3b82f6" radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="إيراد"
                  stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Source breakdown + Lost reasons */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Source breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-black text-slate-800 text-sm mb-4">مصادر العملاء</h2>
          {sourceData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">لا توجد بيانات</p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={80}
                    label={(p: PieLabelRenderProps) =>
                      `${String(p.name ?? '')} ${((p.percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Lost reasons */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-black text-slate-800 text-sm mb-4">أسباب خسارة الصفقات</h2>
          {lostReasons.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">لا توجد بيانات خسارة</p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lostReasons} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="reason" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" name="عدد العملاء" fill="#ef4444" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Deal stages */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-black text-slate-800 text-sm mb-4">توزيع الصفقات حسب المرحلة</h2>
        {stageData.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">لا توجد صفقات</p>
        ) : (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="عدد الصفقات" radius={[6,6,0,0]}>
                  {stageData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
