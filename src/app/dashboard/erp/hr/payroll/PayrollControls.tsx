'use client'

import { useActionState, useTransition } from 'react'
import { Play, CheckCircle2, ChevronsUp, Banknote } from 'lucide-react'
import { runPayrollAction, approvePayrollAction, approveAllPayrollAction, markAsPaidAction, type PayrollActionState } from './actions'

const initial: PayrollActionState = { ok: false, message: '' }

export function RunPayrollForm({ defaultMonth, defaultYear }: { defaultMonth: number; defaultYear: number }) {
  const [state, action, pending] = useActionState(runPayrollAction, initial)

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">PAYROLL ENGINE</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">إصدار مسيرة رواتب</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            يحتسب تلقائياً: الراتب الأساسي + البدلات + الحوافز + العمولات — خصم الغياب والتأخير والإجازات غير المدفوعة والتأمينات والضريبة.
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Play className="size-5" />
        </span>
      </div>

      {state.message ? (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      ) : null}

      <form action={action} className="grid gap-4 sm:grid-cols-3" noValidate>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">الشهر</span>
          <select name="month" defaultValue={defaultMonth} className={inputClass}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleDateString('ar-EG', { month: 'long' })}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">السنة</span>
          <input name="year" type="number" defaultValue={defaultYear} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">أيام العمل</span>
          <input name="workingDays" type="number" defaultValue={22} min={1} max={31} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">البدلات (ج.م)</span>
          <input name="allowances" type="number" defaultValue={0} min={0} className={inputClass} placeholder="0" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">الحوافز / المكافآت (ج.م)</span>
          <input name="bonus" type="number" defaultValue={0} min={0} className={inputClass} placeholder="0" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">أوفر تايم (ج.م)</span>
          <input name="overtime" type="number" defaultValue={0} min={0} className={inputClass} placeholder="0" />
        </label>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={pending}
            className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
          >
            <Play className="size-4" />
            {pending ? 'جاري الاحتساب...' : 'إصدار المسيرة'}
          </button>
        </div>
      </form>
    </section>
  )
}

export function ApprovePayrollButton({ employeeId, month, year }: { employeeId: string; month: number; year: number }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await approvePayrollAction(employeeId, month, year) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
    >
      <CheckCircle2 className="size-3.5" />
      {pending ? '...' : 'إقرار'}
    </button>
  )
}

export function ApproveAllButton({ month, year, companyId }: { month: number; year: number; companyId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await approveAllPayrollAction(month, year, companyId) })}
      className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
    >
      <ChevronsUp className="size-4" />
      {pending ? 'جاري الإقرار...' : 'إقرار الكل'}
    </button>
  )
}

export function MarkAsPaidButton({ month, year, companyId }: { month: number; year: number; companyId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await markAsPaidAction(month, year, companyId) })}
      className="flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
    >
      <Banknote className="size-4" />
      {pending ? 'جاري التسجيل...' : 'تسجيل الصرف'}
    </button>
  )
}

const inputClass = 'h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'
