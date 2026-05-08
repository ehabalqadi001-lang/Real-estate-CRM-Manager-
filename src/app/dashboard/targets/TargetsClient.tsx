'use client'

import { useState } from 'react'
import { Plus, X, TrendingUp, Target, Users } from 'lucide-react'
import type { AgentTarget } from './actions'
import { useI18n } from '@/hooks/use-i18n'

interface Agent { id: string; full_name: string | null }

function ProgressBar({ actual, target, color }: { actual: number; target: number; color: string }) {
  const { numLocale } = useI18n()
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0
  const label = target > 0 ? `${pct}%` : '—'
  const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1">
        <span className={color}>{label}</span>
        <span className="text-slate-400">{actual.toLocaleString(numLocale)} / {target.toLocaleString(numLocale)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function TargetsClient({
  targets, agents, currentMonth, setTargetAction,
}: {
  targets: AgentTarget[]
  agents: Agent[]
  currentMonth: string
  setTargetAction: (fd: FormData) => Promise<void>
}) {
  const { t } = useI18n()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')

  const handleSubmit = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await setTargetAction(fd)
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-slate-800 flex items-center gap-2"><Users size={16} /> {t('أهداف الوكلاء', 'Agent Targets')}</h2>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
          <Plus size={15} /> {t('تعيين هدف', 'Set Target')}
        </button>
      </div>

      {/* Targets grid */}
      {targets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Target size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">{t('لم يتم تعيين أهداف لهذا الشهر بعد', 'No targets set for this month yet')}</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">
            {t('ابدأ بتعيين الأهداف', 'Start Setting Targets')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {targets.map(tgt => {
            const revPct = tgt.revenue_target > 0 ? Math.round((tgt.revenue_actual / tgt.revenue_target) * 100) : 0
            const medal = revPct >= 100 ? '🥇' : revPct >= 80 ? '🥈' : revPct >= 60 ? '🥉' : ''
            return (
              <div key={tgt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{tgt.agent_name} {medal}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{tgt.month}</p>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    revPct >= 100 ? 'bg-emerald-100 text-emerald-700' :
                    revPct >= 70  ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                  }`}>
                    {revPct}%
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                      <TrendingUp size={12} /> {t('الإيراد', 'Revenue')}
                    </div>
                    <ProgressBar
                      actual={tgt.revenue_actual}
                      target={tgt.revenue_target}
                      color="text-blue-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {(tgt.revenue_actual / 1_000_000).toFixed(2)}M / {(tgt.revenue_target / 1_000_000).toFixed(2)}M {t('ج.م', 'EGP')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                      <Target size={12} /> {t('الصفقات', 'Deals')}
                    </div>
                    <ProgressBar actual={tgt.deals_actual} target={tgt.deals_target} color="text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                      <Users size={12} /> {t('العملاء الجدد', 'New Clients')}
                    </div>
                    <ProgressBar actual={tgt.leads_actual} target={tgt.leads_target} color="text-teal-600" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Set target modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Target size={16} className="text-orange-500" /> {t('تعيين هدف شهري', 'Set Monthly Target')}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الوكيل', 'Agent')}</label>
                <select name="agent_id" required value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 bg-white">
                  <option value="">{t('-- اختر الوكيل --', '-- Select Agent --')}</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.full_name ?? a.id}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الشهر', 'Month')}</label>
                <input type="month" name="month" defaultValue={currentMonth} required
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('الإيراد (ج.م)', 'Revenue (EGP)')}</label>
                  <input type="number" name="revenue_target" min={0} placeholder="0" required
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('عدد الصفقات', 'No. of Deals')}</label>
                  <input type="number" name="deals_target" min={0} placeholder="0" required
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('عملاء جدد', 'New Clients')}</label>
                  <input type="number" name="leads_target" min={0} placeholder="0" required
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50">
                {loading ? t('جاري الحفظ...', 'Saving...') : t('حفظ الهدف', 'Save Target')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
