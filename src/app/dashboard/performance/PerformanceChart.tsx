'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'

interface AgentStats {
  full_name: string
  revenue: number
  deals: number
  conversion: number
}

interface Props {
  agents: AgentStats[]
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#10b981']

export default function PerformanceChart({ agents }: Props) {
  if (agents.length === 0) return null

  const data = agents.slice(0, 8).map((a, i) => ({
    name: a.full_name.split(' ').slice(0, 2).join(' '),
    إيراد: Math.round(a.revenue / 1000),
    صفقات: a.deals,
    تحويل: a.conversion,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Revenue bar chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-4 text-sm">الإيراد بالألف جنيه</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v}K`} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                formatter={(v) => [`${Number(v).toLocaleString()}K ج.م`, 'الإيراد']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="إيراد" radius={[0, 6, 6, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                <LabelList dataKey="إيراد" position="right" style={{ fontSize: 10, fill: '#64748b' }}
                  formatter={(v: unknown) => `${v}K`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deals + conversion */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-4 text-sm">الصفقات ومعدل التحويل</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="صفقات" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="صفقات" position="top" style={{ fontSize: 10, fill: '#64748b' }} />
              </Bar>
              <Bar dataKey="تحويل" fill="#10b981" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="تحويل" position="top" style={{ fontSize: 10, fill: '#64748b' }}
                  formatter={(v: unknown) => `${v}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
