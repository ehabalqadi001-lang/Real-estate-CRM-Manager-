'use client'

import { useActionState } from 'react'
import { Brain } from 'lucide-react'
import { saveBurnoutIndicatorAction, type HRBPActionState } from './actions'
import { useI18n } from '@/hooks/use-i18n'

const initial: HRBPActionState = { ok: false, message: '' }

type EmployeeOption = { id: string; name: string; jobTitle: string | null }

export function BurnoutForm({ employees }: { employees: EmployeeOption[] }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(saveBurnoutIndicatorAction, initial)
  const now = new Date()

  return (
    <section className="ds-card p-5" dir="rtl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">BURNOUT MONITOR</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">{t('رصد مؤشرات الإجهاد', 'Burnout Indicator Monitor')}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            {t('احتساب درجة الإجهاد تلقائياً من 5 مؤشرات مرجحة.', 'Automatically calculates burnout score from 5 weighted indicators.')}
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <Brain className="size-5" />
        </span>
      </div>

      {state.message ? (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      ) : null}

      <form key={state.ok ? state.message : 'burnout-form'} action={action} className="grid gap-4 md:grid-cols-2" noValidate>
        <Field label={t('الموظف', 'Employee')}>
          <select name="employeeId" required className={inputClass}>
            <option value="">{t('اختر الموظف', 'Select employee')}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} — {e.jobTitle ?? t('غير محدد', 'Unspecified')}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
          <Field label={t('الشهر', 'Month')}>
            <input name="periodMonth" type="number" min={1} max={12} defaultValue={now.getMonth() + 1} className={inputClass} />
          </Field>
          <Field label={t('السنة', 'Year')}>
            <input name="periodYear" type="number" min={2020} max={2099} defaultValue={now.getFullYear()} className={inputClass} />
          </Field>
        </div>

        <Field label={t('درجة عبء العمل (0–10)', 'Workload Score (0–10)')}>
          <input name="workloadScore" type="number" min={0} max={10} step={0.5} defaultValue={5} className={inputClass} />
        </Field>

        <Field label={t('ساعات إضافية (الشهر)', 'Overtime Hours (Month)')}>
          <input name="overtimeHours" type="number" min={0} step={0.5} defaultValue={0} className={inputClass} />
        </Field>

        <Field label={t('أيام غياب', 'Absence Days')}>
          <input name="absenceDays" type="number" min={0} defaultValue={0} className={inputClass} />
        </Field>

        <Field label={t('تأخيرات الحضور', 'Late Check-ins')}>
          <input name="lateCheckIns" type="number" min={0} defaultValue={0} className={inputClass} />
        </Field>

        <Field label={t('نسبة الأهداف الفائتة (%)', 'Missed Targets (%)')}>
          <input name="missedTargetsPct" type="number" min={0} max={100} step={1} defaultValue={0} className={inputClass} />
        </Field>

        <Field label={t('ملاحظات HRBP', 'HRBP Notes')}>
          <input name="hrNotes" className={inputClass} placeholder={t('اختياري', 'optional')} />
        </Field>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
          >
            {pending ? t('جاري الاحتساب...', 'Calculating...') : t('احتساب مؤشر الإجهاد وحفظه', 'Calculate & Save Burnout Score')}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[var(--fi-ink)]">{label}</span>
      {children}
    </label>
  )
}

const inputClass = 'h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition placeholder:text-[var(--fi-muted)] focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5'
