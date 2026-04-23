'use client'

import { useActionState } from 'react'
import { Network, Plus } from 'lucide-react'
import { createWorkCellAction, type CellActionState } from './actions'

type AgentOption = {
  id: string
  full_name: string | null
}

const initialState: CellActionState = { ok: false, message: '' }
const inputClass =
  'h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)] dark:bg-white/5'

export function AddCellForm({ agents }: { agents: AgentOption[] }) {
  const [state, action, pending] = useActionState(createWorkCellAction, initialState)

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">
            CELL OPERATING MODEL
          </p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">إنشاء خلية عمل</h2>
          <p className="mt-1 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
            قسّم فريق FAST INVESTMENT إلى خلايا مستقلة مع قائد، هدف GMV، ومعدل تحويل واضح لكل خلية.
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <Network className="size-5" />
        </span>
      </div>

      {state.message ? (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${
            state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">اسم الخلية</span>
          <input name="nameAr" className={inputClass} placeholder="مثال: خلية العاصمة الإدارية" required />
        </label>

        <label>
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">قائد الخلية</span>
          <select name="leaderId" className={inputClass} defaultValue="">
            <option value="">بدون قائد حالياً</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.full_name ?? 'بدون اسم'}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">هدف GMV الشهري</span>
          <input name="monthlyGmvTarget" type="number" min={0} className={inputClass} placeholder="110000000" />
        </label>

        <label>
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">هدف العملاء</span>
          <input name="monthlyLeadsTarget" type="number" min={0} className={inputClass} placeholder="300" />
        </label>

        <label>
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">هدف التحويل %</span>
          <input name="conversionTargetPct" type="number" min={0} step="0.01" className={inputClass} placeholder="12" />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="fi-primary-button flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black sm:col-span-2 disabled:opacity-60"
        >
          <Plus className="size-4" />
          {pending ? 'جاري الإنشاء...' : 'إنشاء الخلية'}
        </button>
      </form>
    </section>
  )
}
