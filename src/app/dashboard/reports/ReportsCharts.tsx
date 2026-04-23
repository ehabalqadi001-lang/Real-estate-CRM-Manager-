'use client'

import {
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

interface MonthPoint { month: string; revenue: number; deals: number }
interface StagePoint { name: string; value: number }
interface AgentRow { name: string; deals: number; revenue: number }

interface Props {
  monthlyTrend: MonthPoint[]
  stageData: StagePoint[]
  agentData: AgentRow[]
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
      <div className="min-w-0 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black text-[var(--fi-ink)]">الإيراد الشهري وعدد الصفقات خلال آخر 12 شهر</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyTrend} margin={{ top: 6, right: 10, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--fi-line)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="rev" tickFormatter={fmt} tick={{ fontSize: 11 }} orientation="right" width={54} />
            <YAxis yAxisId="deals" tick={{ fontSize: 11 }} orientation="left" width={34} />
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name) => [
                name === 'revenue' ? `${fmt(Number(value))} ج.م` : value,
                name === 'revenue' ? 'الإيراد' : 'الصفقات',
              ]}
            />
            <Legend formatter={(value) => value === 'revenue' ? 'الإيراد' : 'الصفقات'} />
            <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke="#00C27C" strokeWidth={2.5} dot={false} />
            <Line yAxisId="deals" type="monotone" dataKey="deals" stroke="#3B82F6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-5 2xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-[var(--fi-ink)]">الصفقات حسب المرحلة</h2>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={stageData} cx="50%" cy="48%" outerRadius={78} dataKey="value" labelLine={false}>
                  {stageData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyReportChart label="لا توجد صفقات كافية لعرض الرسم" />
          )}
        </div>

        <div className="min-w-0 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black text-[var(--fi-ink)]">أداء الوكلاء حسب أعلى إيراد</h2>
          {agentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={agentData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--fi-line)" horizontal={false} />
                <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={86} />
                <Tooltip {...tooltipStyle} formatter={(value) => [`${fmt(Number(value))} ج.م`, 'الإيراد']} />
                <Bar dataKey="revenue" fill="#00C27C" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyReportChart label="لا توجد بيانات وكلاء كافية لعرض الرسم" />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyReportChart({ label }: { label: string }) {
  return (
    <div className="flex h-[230px] items-center justify-center rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] text-sm font-bold text-[var(--fi-muted)]">
      {label}
    </div>
  )
}
