'use client'

import { useActionState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { createJournalEntryAction, type FinanceActionState } from './actions'

type Account = { id: string; account_code: string; account_name: string; account_type: string }

const initial: FinanceActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

export function JournalEntryForm({
  companyId,
  accounts,
}: {
  companyId: string | null
  accounts: Account[]
}) {
  const [state, action, pending] = useActionState(createJournalEntryAction, initial)

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden" dir="rtl">
      <div className="flex items-center gap-3 border-b border-[var(--fi-line)] p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <BookOpen size={16} />
        </div>
        <div>
          <h2 className="font-bold text-[var(--fi-ink)]">إنشاء قيد محاسبي</h2>
          <p className="text-xs text-[var(--fi-muted)]">قيد يومية مزدوج — مدين / دائن</p>
        </div>
      </div>

      {state.message && (
        <div className={`mx-4 mt-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      )}

      <form action={action} className="grid gap-4 p-4 sm:grid-cols-2">
        <label className="sm:col-span-2 block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">البيان</span>
          <input name="description" required placeholder="مثال: استلام دفعة من مطور عقاري..." className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">تاريخ القيد</span>
          <input name="entryDate" type="date" required defaultValue={today} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">المبلغ (ج.م)</span>
          <input name="amount" type="number" required min="1" step="0.01" placeholder="0.00" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">الحساب المدين (مدين)</span>
          <select name="debitAccountId" required className={inputClass}>
            <option value="">— اختر حسابًا —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.account_code} — {a.account_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[var(--fi-muted)]">الحساب الدائن (دائن)</span>
          <select name="creditAccountId" required className={inputClass}>
            <option value="">— اختر حسابًا —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.account_code} — {a.account_name}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending || !accounts.length}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {pending ? 'جاري الحفظ...' : 'حفظ القيد'}
          </button>
          {!accounts.length && (
            <p className="mt-2 text-center text-xs text-amber-600 font-bold">أضف حسابات إلى دليل الحسابات أولاً.</p>
          )}
        </div>
      </form>
    </div>
  )
}
