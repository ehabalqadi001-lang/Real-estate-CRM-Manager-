'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { scoreLeadWithAIAction, batchScoreLeadsAction, type LeadScoreResult } from './actions'
import { MODEL_OPTIONS, type AIModel } from '@/lib/ai-provider'
import { Flame, TrendingUp, Target, Brain, Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react'

interface Lead {
  id: string
  full_name: string | null
  status: string | null
  score: number | null
  temperature: string | null
  source: string | null
  budget: number | null
  last_contact_at: string | null
  created_at: string
}

interface Props { leads: Lead[] }

const TEMP_CONFIG = {
  hot:  { icon: Flame,      color: 'text-red-500',   bg: 'bg-red-50 border-red-200',     label: 'ساخن' },
  warm: { icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: 'دافئ' },
  cold: { icon: Target,     color: 'text-blue-400',  bg: 'bg-blue-50 border-blue-200',   label: 'بارد' },
}

export function LeadScoringClient({ leads }: Props) {
  const [model, setModel] = useState<AIModel>('claude-sonnet-4-6')
  const [results, setResults] = useState<Record<string, LeadScoreResult>>({})
  const [scoring, setScoring] = useState<Set<string>>(new Set())
  const [batchDone, setBatchDone] = useState<{ count: number; errors: number } | null>(null)
  const [pending, start] = useTransition()

  const handleScoreOne = (leadId: string) => {
    setScoring(prev => new Set(prev).add(leadId))
    start(async () => {
      const res = await scoreLeadWithAIAction(leadId, model)
      if (res.result) setResults(prev => ({ ...prev, [leadId]: res.result! }))
      setScoring(prev => { const s = new Set(prev); s.delete(leadId); return s })
    })
  }

  const handleBatchScore = () => {
    const ids = leads.slice(0, 20).map(l => l.id)
    ids.forEach(id => setScoring(prev => new Set(prev).add(id)))
    start(async () => {
      const res = await batchScoreLeadsAction(ids, model)
      res.results.forEach(r => setResults(prev => ({ ...prev, [r.leadId]: r })))
      setScoring(new Set())
      setBatchDone({ count: res.results.length, errors: res.errors })
    })
  }

  const getTemp = (lead: Lead, result?: LeadScoreResult) => {
    const t = result?.temperature ?? lead.temperature ?? null
    return t && t in TEMP_CONFIG ? t as keyof typeof TEMP_CONFIG : null
  }

  const getScore = (lead: Lead, result?: LeadScoreResult) =>
    result?.score ?? lead.score ?? 0

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-[var(--fi-emerald)]" />
          <p className="text-sm font-black text-[var(--fi-ink)]">النموذج</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODEL_OPTIONS.map(m => (
            <button
              key={m.value}
              onClick={() => setModel(m.value as AIModel)}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${model === m.value ? 'bg-[var(--fi-emerald)] text-white shadow' : 'border border-[var(--fi-line)] text-[var(--fi-muted)] hover:border-[var(--fi-emerald)]/40'}`}
            >
              {m.badge} {m.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {batchDone && (
            <span className="flex items-center gap-1 text-xs font-semibold text-[var(--fi-emerald)]">
              <CheckCircle2 className="size-3.5" />تم تقييم {batchDone.count} عميل
              {batchDone.errors > 0 && <span className="text-red-500">({batchDone.errors} خطأ)</span>}
            </span>
          )}
          <Button
            size="sm"
            disabled={pending}
            onClick={handleBatchScore}
            className="fi-primary-button gap-1.5"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
            تقييم الكل (أول 20)
          </Button>
        </div>
      </div>

      {/* Leads table */}
      <div className="overflow-hidden rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm">
        <div className="divide-y divide-[var(--fi-line)]">
          {leads.map(lead => {
            const result  = results[lead.id]
            const temp    = getTemp(lead, result)
            const score   = getScore(lead, result)
            const TmpIcon = temp ? TEMP_CONFIG[temp].icon : Target
            const isScoring = scoring.has(lead.id)

            return (
              <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                {/* Score circle */}
                <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border-2 text-center ${temp ? TEMP_CONFIG[temp].bg : 'border-slate-200 bg-slate-50'}`}>
                  <span className={`text-xs font-black leading-none ${temp ? TEMP_CONFIG[temp].color : 'text-slate-400'}`}>{score}</span>
                  {temp && <TmpIcon className={`size-2.5 ${TEMP_CONFIG[temp].color}`} />}
                </div>

                {/* Lead info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-[var(--fi-ink)]">{lead.full_name ?? 'غير محدد'}</p>
                    {temp && (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${TEMP_CONFIG[temp].bg} ${TEMP_CONFIG[temp].color}`}>
                        {TEMP_CONFIG[temp].label}
                      </span>
                    )}
                    {lead.status && <span className="text-xs text-[var(--fi-muted)]">{lead.status}</span>}
                  </div>

                  {result ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs font-semibold text-[var(--fi-muted)]">
                        <span className="font-black text-[var(--fi-emerald)]">السبب:</span> {result.reason}
                      </p>
                      <p className="text-xs font-semibold text-[var(--fi-muted)]">
                        <span className="font-black text-[#C9964A]">الخطوة:</span> {result.nextAction}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-0.5 text-xs text-[var(--fi-muted)]">
                      {lead.source && `المصدر: ${lead.source}`}
                      {lead.budget && ` · الميزانية: ${Number(lead.budget).toLocaleString('ar-EG')} ج.م`}
                    </p>
                  )}
                </div>

                {/* Urgency badge */}
                {result?.urgency && (
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
                    result.urgency === 'high' ? 'bg-red-50 text-red-700' :
                    result.urgency === 'medium' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {result.urgency === 'high' ? 'عاجل' : result.urgency === 'medium' ? 'متوسط' : 'منخفض'}
                  </span>
                )}

                {/* Score button */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isScoring || pending}
                  onClick={() => handleScoreOne(lead.id)}
                  className="shrink-0 gap-1 text-xs"
                >
                  {isScoring ? <Loader2 className="size-3 animate-spin" /> : <Brain className="size-3" />}
                  {result ? 'إعادة' : 'تقييم'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
