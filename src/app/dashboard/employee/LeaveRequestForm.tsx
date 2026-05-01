'use client'

import { useActionState } from 'react'
import { CalendarOff } from 'lucide-react'
import { requestLeaveAction, type LeaveActionState } from '../erp/hr/leaves/actions'

export type LeaveTypeOption = { id: string; name_ar: string | null; name: string; days_per_year: number; is_paid: boolean }

const initial: LeaveActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

export function LeaveRequestForm({
  employeeId,
  leaveTypes,
}: {
  employeeId: string
  leaveTypes: LeaveTypeOption[]
}) {
  const [state, action, pending] = useActionState(requestLeaveAction, initial)

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">LEAVE REQUEST</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">طلب إجازة</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            قدّم طلب إجازة — سيصل للمدير المباشر فوراً.
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <CalendarOff className="size-5" />
        </span>
      </div>

      {state.message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      )}

      {leaveTypes.length === 0 ? (
        <p className="text-sm font-bold text-[var(--fi-muted)]">
          لا توجد أنواع إجازات مُعرَّفة. تواصل مع مدير HR.
        </p>
      ) : (
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="employeeId" value={employeeId} />

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">نوع الإجازة</span>
            <select name="leaveTypeId" required className={inputClass}>
              <option value="">— اختر نوع الإجازة —</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name_ar ?? lt.name} — {lt.days_per_year} يوم/سنة{lt.is_paid ? '' : ' (بدون راتب)'}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">تاريخ البداية</span>
            <input name="startDate" type="date" required className={inputClass} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">تاريخ الانتهاء</span>
            <input name="endDate" type="date" required className={inputClass} />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">السبب (اختياري)</span>
            <textarea
              name="reason"
              rows={2}
              placeholder="أسباب الطلب..."
              className="w-full resize-none rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="fi-primary-button flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
            >
              <CalendarOff className="size-4" />
              {pending ? 'جاري الإرسال...' : 'تقديم طلب الإجازة'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
