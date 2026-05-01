'use client'

import { useActionState, useTransition, useState } from 'react'
import { Star, Target, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import {
  createReviewCycleAction,
  submitManagerReviewAction,
  addGoalAction,
  type PerfActionState,
} from './actions'

const initial: PerfActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

type EmployeeOption = { id: string; name: string; jobTitle: string | null }

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarRating({ name, label }: { name: string; label: string }) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{label}</span>
      <input type="hidden" name={name} value={selected} />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onMouseEnter={() => setHovered(v)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(v)}
            className="transition"
          >
            <Star
              className={`size-7 ${(hovered || selected) >= v ? 'fill-amber-400 text-amber-400' : 'text-[var(--fi-line)]'}`}
            />
          </button>
        ))}
        {selected > 0 && (
          <span className="mr-2 self-center text-sm font-black text-amber-600">{selected}/5</span>
        )}
      </div>
    </label>
  )
}

// ─── Create Review Cycle Form ─────────────────────────────────────────────────
export function CreateReviewCycleForm({ employees }: { employees: EmployeeOption[] }) {
  const [state, action, pending] = useActionState(createReviewCycleAction, initial)
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="ds-card p-5" dir="rtl">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between"
      >
        <div className="text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">REVIEW ENGINE</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">إنشاء دورة تقييم جديدة</h2>
        </div>
        {expanded ? <ChevronUp className="size-5 text-[var(--fi-muted)]" /> : <ChevronDown className="size-5 text-[var(--fi-muted)]" />}
      </button>

      {expanded && (
        <>
          {state.message && (
            <div className={`mt-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {state.message}
            </div>
          )}
          <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">نوع الدورة</span>
              <select name="reviewCycle" className={inputClass}>
                <option value="annual">سنوي</option>
                <option value="quarterly">ربع سنوي</option>
                <option value="probation">فترة تجريبية</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">عنوان الفترة</span>
              <input name="periodLabel" placeholder="مثال: Q2 2026 أو سنوي 2025" required className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">بداية الفترة</span>
              <input name="periodStart" type="date" required className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">نهاية الفترة</span>
              <input name="periodEnd" type="date" required className={inputClass} />
            </label>
            <div className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">الموظفون</span>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3">
                {employees.map((e) => (
                  <label key={e.id} className="flex cursor-pointer items-center gap-2 rounded p-1.5 text-sm font-bold text-[var(--fi-ink)] hover:bg-white">
                    <input type="checkbox" name="employeeIds" value={e.id} className="accent-emerald-600" />
                    {e.name}{e.jobTitle ? ` — ${e.jobTitle}` : ''}
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={pending}
                className="fi-primary-button flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
              >
                <Star className="size-4" />
                {pending ? 'جاري الإنشاء...' : 'إنشاء دورة التقييم'}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}

// ─── Manager Score Form ───────────────────────────────────────────────────────
export function ManagerReviewForm({ reviewId, employeeName }: { reviewId: string; employeeName: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<PerfActionState | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const scores = {
      sales:      Number(fd.get('mgr_sales') ?? 3),
      teamwork:   Number(fd.get('mgr_teamwork') ?? 3),
      attendance: Number(fd.get('mgr_attendance') ?? 3),
      initiative: Number(fd.get('mgr_initiative') ?? 3),
      knowledge:  Number(fd.get('mgr_knowledge') ?? 3),
    }
    const notes = String(fd.get('mgr_notes') ?? '')
    const promotion = fd.get('promotion') === 'on'
    const salaryInc = Number(fd.get('salary_increase') ?? 0) || null
    startTransition(async () => {
      const res = await submitManagerReviewAction(reviewId, scores, notes, promotion, salaryInc)
      setResult(res)
      if (res.ok) setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
      >
        <CheckCircle2 className="size-3.5" />
        تقييم المدير
      </button>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4" dir="rtl">
      <p className="mb-3 text-sm font-black text-[var(--fi-ink)]">تقييم المدير — {employeeName}</p>
      {result && (
        <p className={`mb-3 text-xs font-bold ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>{result.message}</p>
      )}
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StarRating name="mgr_sales"      label="المبيعات والإنجاز" />
        <StarRating name="mgr_teamwork"   label="العمل الجماعي" />
        <StarRating name="mgr_attendance" label="الالتزام والحضور" />
        <StarRating name="mgr_initiative" label="المبادرة والإبداع" />
        <StarRating name="mgr_knowledge"  label="المعرفة التقنية" />
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">زيادة الراتب %</span>
          <input name="salary_increase" type="number" min={0} max={100} step={0.5} placeholder="0" className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-sm font-black text-[var(--fi-ink)]">
          <input type="checkbox" name="promotion" className="accent-emerald-600 size-4" />
          مرشح للترقية
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">ملاحظات المدير</span>
          <textarea name="mgr_notes" rows={2} className="w-full resize-none rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2 text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100" />
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <button type="submit" disabled={pending} className="fi-primary-button flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-black disabled:opacity-60">
            {pending ? 'جاري الحفظ...' : 'إتمام التقييم'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg border border-[var(--fi-line)] px-4 text-sm font-bold text-[var(--fi-muted)] hover:bg-white">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Add Goal Form ────────────────────────────────────────────────────────────
export function AddGoalForm({ employeeId, reviewId }: { employeeId: string; reviewId?: string }) {
  const [state, action, pending] = useActionState(addGoalAction, initial)
  const [open, setOpen] = useState(false)

  return (
    <div>
      {!open && (
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--fi-line)] px-3 py-1.5 text-xs font-black text-[var(--fi-muted)] transition hover:border-emerald-400 hover:text-emerald-600">
          <Target className="size-3.5" />
          إضافة هدف
        </button>
      )}
      {open && (
        <form action={action} className="mt-2 grid gap-3 sm:grid-cols-4" dir="rtl">
          <input type="hidden" name="employeeId" value={employeeId} />
          {reviewId && <input type="hidden" name="reviewId" value={reviewId} />}
          <input name="title" placeholder="عنوان الهدف*" required className={`${inputClass} sm:col-span-2`} />
          <input name="targetValue" type="number" placeholder="قيمة الهدف" className={inputClass} />
          <input name="unit" placeholder="الوحدة (صفقة، ج.م...)" className={inputClass} />
          <input name="weightPct" type="number" defaultValue={20} min={5} max={100} className={inputClass} />
          <input name="dueDate" type="date" className={inputClass} />
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={pending} className="h-10 flex-1 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {pending ? '...' : 'حفظ الهدف'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg border border-[var(--fi-line)] px-3 text-xs font-bold text-[var(--fi-muted)]">
              إلغاء
            </button>
          </div>
          {state.message && <p className={`text-xs font-bold sm:col-span-4 ${state.ok ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
        </form>
      )}
    </div>
  )
}
