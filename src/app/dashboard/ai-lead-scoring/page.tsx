import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { Flame, TrendingUp, Target, Brain } from 'lucide-react'
import { LeadScoringClient } from './LeadScoringClient'

export const dynamic = 'force-dynamic'

export default async function AILeadScoringPage() {
  await requirePermission('lead.view.own')
  const { profile } = await requireSession()
  const supabase = await createRawClient()
  const companyId = profile.company_id ?? profile.id

  const { data: raw } = await supabase
    .from('leads')
    .select('id, full_name, status, score, temperature, source, budget, last_contact_at, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(100)

  const leads = (raw ?? []) as {
    id: string; full_name: string | null; status: string | null; score: number | null
    temperature: string | null; source: string | null; budget: number | null
    last_contact_at: string | null; created_at: string
  }[]

  const hot  = leads.filter(l => l.temperature === 'hot').length
  const warm = leads.filter(l => l.temperature === 'warm').length
  const cold = leads.filter(l => l.temperature === 'cold').length
  const unscored = leads.filter(l => !l.temperature).length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[var(--fi-emerald)]">NEXUS AI Lead Scoring 2.0</p>
        <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">تقييم العملاء بالذكاء الاصطناعي</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
          صنّف عملاءك المحتملين تلقائياً — ساخن / دافئ / بارد — مع سبب واضح والخطوة التالية. يعمل بـ Claude وGemini.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: <Flame className="size-5" />,      value: hot,      label: 'ساخن',        color: 'text-red-500',   bg: 'border-red-100 bg-red-50' },
          { icon: <TrendingUp className="size-5" />, value: warm,     label: 'دافئ',        color: 'text-amber-500', bg: 'border-amber-100 bg-amber-50' },
          { icon: <Target className="size-5" />,     value: cold,     label: 'بارد',        color: 'text-blue-400',  bg: 'border-blue-100 bg-blue-50' },
          { icon: <Brain className="size-5" />,      value: unscored, label: 'لم يُقيَّم بعد', color: 'text-slate-400', bg: 'border-slate-200 bg-slate-50' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 shadow-sm ${k.bg}`}>
            <div className={`mb-2 ${k.color}`}>{k.icon}</div>
            <p className="text-2xl font-black text-[var(--fi-ink)]">{k.value}</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">{k.label}</p>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--fi-line)] py-16 text-center">
          <Brain className="size-10 text-[var(--fi-line)]" />
          <p className="font-bold text-[var(--fi-muted)]">لا يوجد عملاء محتملون بعد</p>
        </div>
      ) : (
        <LeadScoringClient leads={leads} />
      )}
    </div>
  )
}
