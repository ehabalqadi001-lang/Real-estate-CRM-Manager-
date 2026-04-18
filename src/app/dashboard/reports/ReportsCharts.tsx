'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface MonthPoint { month: string; revenue: number; deals: number }
interface StagePoint  { name: string; value: number }
interface AgentRow    { name: string; deals: number; revenue: number }

interface Props {
  monthlyTrend: MonthPoint[]
  stageData:    StagePoint[]
  agentData:    AgentRow[]
}

const COLORS = ['#00C27C', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4']

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

const tooltipStyle = {
  contentStyle: { background: 'var(--fi-paper)', border: '1px solid var(--fi-line)', borderRadius: 10, fontSize: 12 },
  labelStyle: { fontWeight: 800, color: 'var(--fi-ink)' },
}

export default function ReportsCharts({ monthlyTrend, stageData, agentData }: Props) {
  return (
    <div className="space-y-5">
      {/* Monthly Revenue + Deals */}
      <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black text-[var(--fi-ink)]">الإيراد الشهري وعدد الصفقات (آخر 12 شهر)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--fi-line)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="rev" tickFormatter={fmt} tick={{ fontSize: 11 }} orientation="right" />
            <YAxis yAxisId="deals" tick={{ fontSize: 11 }} orientation="left" />
            <Tooltip {...tooltipStyle} formatter={(v, name) => [
              name === 'revenue' ? `${fmt(Number(v))} ج.م` : v,
              name === 'revenue' ? 'الإيراد' : 'الصفقات',
            ]} />
            <Legend formatter={(v) => v === 'revenue' ? 'الإيراد' : 'الصفقات'} />
            <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke="#00C27C" strokeWidth={2.5} dot={false} />
            <Line yAxisId="deals" type="monotone" dataKey="deals"   stroke="#3B82F6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Deals by Stage */}
        <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-[var(--fi-ink)]">الصفقات حسب المرحلة</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stageData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {stageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Leaderboard */}
        <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-[var(--fi-ink)]">أداء الوكلاء (أعلى إيراد)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--fi-line)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${fmt(Number(v))} ج.م`, 'الإيراد']} />
              <Bar dataKey="revenue" fill="#00C27C" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
