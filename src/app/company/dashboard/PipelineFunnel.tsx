'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { stage: string; count: number; value: number }[]
}

const COLORS = ['#00C27C', '#009F64', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444']

export default function PipelineFunnel({ data }: Props) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800">مسار الصفقات (Pipeline)</h3>
        <p className="text-xs text-slate-400">توزيع الصفقات حسب المرحلة</p>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-slate-300 text-sm font-bold">لا توجد صفقات</div>
      ) : (
        <>
          <div className="h-[180px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false}
                  tick={{ fontSize: 10 }} width={70} />
                <Tooltip
                  formatter={(value, name) => name === 'count' ? [`${value} صفقة`, 'العدد'] : [`${Number(value).toLocaleString()} ج.م`, 'القيمة']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={d.stage} className="flex items-center gap-3">
                {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-bold text-slate-700">{d.stage}</span>
                    <span className="text-slate-500">{d.count} ({((d.count / Math.max(data.reduce((s,x)=>s+x.count,0),1))*100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                    <div className="h-full rounded-full transition-all" style={{ width: `${(d.count / maxCount) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
