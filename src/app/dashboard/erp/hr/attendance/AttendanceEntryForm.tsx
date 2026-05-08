'use client'

import { useActionState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { manualAttendanceEntryAction, type AttendanceActionState } from './actions'
import { useI18n } from '@/hooks/use-i18n'

export type EmployeeOption = { id: string; name: string; jobTitle: string | null }

const initial: AttendanceActionState = { ok: false, message: '' }

const inputClass =
  'h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'

export function AttendanceEntryForm({ employees }: { employees: EmployeeOption[] }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(manualAttendanceEntryAction, initial)

  const statusOptions = [
    { value: 'present',  label: t('حاضر', 'Present') },
    { value: 'absent',   label: t('غائب', 'Absent') },
    { value: 'late',     label: t('متأخر', 'Late') },
    { value: 'half_day', label: t('نصف يوم', 'Half Day') },
  ]

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">MANUAL ENTRY</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">{t('إدخال حضور يدوي', 'Manual Attendance Entry')}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            {t('تسجيل أو تعديل حضور الموظفين مباشرة من لوحة HR.', 'Record or edit employee attendance directly from the HR panel.')}
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <ClipboardCheck className="size-5" />
        </span>
      </div>

      {state.message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      )}

      <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('الموظف', 'Employee')}</span>
          <select name="employeeId" required className={inputClass}>
            <option value="">{t('— اختر موظفاً —', '— Select employee —')}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{e.jobTitle ? ` — ${e.jobTitle}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('التاريخ', 'Date')}</span>
          <input
            name="logDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('الحالة', 'Status')}</span>
          <select name="status" defaultValue="present" className={inputClass}>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('وقت الدخول', 'Check-in Time')}</span>
          <input name="checkIn" type="time" defaultValue="09:00" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('وقت الخروج', 'Check-out Time')}</span>
          <input name="checkOut" type="time" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{t('ملاحظات', 'Notes')}</span>
          <input name="notes" type="text" placeholder={t('اختياري...', 'optional...')} className={inputClass} />
        </label>

        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={pending}
            className="fi-primary-button flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
          >
            <ClipboardCheck className="size-4" />
            {pending ? t('جاري الحفظ...', 'Saving...') : t('تسجيل الحضور', 'Record Attendance')}
          </button>
        </div>
      </form>
    </section>
  )
}
