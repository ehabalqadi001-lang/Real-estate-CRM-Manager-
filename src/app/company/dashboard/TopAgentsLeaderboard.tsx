'use client'

import { Trophy, TrendingUp } from 'lucide-react'

interface AgentStat {
  id: string
  name: string
  deals: number
  revenue: number
  leads: number
}

interface Props { agents: AgentStat[] }

const medals = ['🥇', '🥈', '🥉']

export default function TopAgentsLeaderboard({ agents }: Props) {
  const sorted = [...agents].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  const maxRev  = sorted[0]?.revenue ?? 1

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" /> لوحة المتصدرين
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">أفضل الوكلاء بالإيراد</p>
        </div>
        <TrendingUp size={16} className="text-slate-300" />
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-slate-300 text-sm font-bold">لا توجد بيانات</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((agent, i) => (
            <div key={agent.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${i === 0 ? 'bg-amber-50 border border-amber-100' : 'hover:bg-slate-50'}`}>
              <div className="text-lg shrink-0 w-6 text-center">{medals[i] ?? `#${i + 1}`}</div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow">
                {agent.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{agent.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-slate-500">{agent.deals} صفقة</span>
                  <span className="text-[10px] text-slate-500">{agent.leads} عميل</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${(agent.revenue / maxRev) * 100}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black text-slate-800">{(agent.revenue / 1_000_000).toFixed(1)}M</p>
                <p className="text-[10px] text-slate-400">ج.م</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
