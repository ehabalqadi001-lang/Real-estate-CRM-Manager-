'use client'
import { useI18n } from '@/hooks/use-i18n'

import { useActionState } from 'react'
import { UserSearch } from 'lucide-react'
import { addCandidateAction, type TalentActionState } from './actions'

const initial: TalentActionState = { ok: false, message: '' }

const roleOptions = [
  'Fresh Sales (Level 1)',
  'Sales Advisor (Level 2)',
  'Property Consultant (Level 3)',
  'Senior Property Consultant (Level 4)',
  'Sales Supervisor (Level 5)',
  'Team Leader (Level 6)',
  'Senior Team Leader (Level 7)',
  'Assistant Sales Manager (Level 8)',
  'Sales Manager (Level 9)',
  'Senior Sales Manager (Level 10)',
  'Sales Director (Level 11)',
]

export function AddCandidateForm() {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(addCandidateAction, initial)

  const sourceOptions = [
    { value: 'manual',   label: t('إضافة يدوية', 'Manual Entry') },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'referral', label: t('ترشيح داخلي', 'Internal Referral') },
    { value: 'website',  label: t('الموقع الإلكتروني', 'Website') },
    { value: 'agency',   label: t('وكالة توظيف', 'Recruitment Agency') },
    { value: 'walk_in',  label: t('حضور مباشر', 'Walk-in') },
  ]

  const arRoleOptions = [
    { value: 'مسؤول مالي',        label: t('مسؤول مالي', 'Finance Officer') },
    { value: 'محاسب/تحصيل',      label: t('محاسب/تحصيل', 'Accountant/Collection') },
    { value: 'أخصائي موارد بشرية', label: t('أخصائي موارد بشرية', 'HR Specialist') },
    { value: 'أخصائي استقطاب',    label: t('أخصائي استقطاب', 'Recruitment Specialist') },
    { value: 'مدير تسويق',        label: t('مدير تسويق', 'Marketing Manager') },
  ]

  return (
    <section className="ds-card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">TALENT ACQUISITION</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">{t('إضافة مرشح', 'Add Candidate')}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">{t('أضف مرشحاً إلى مجمع المواهب وابدأ رحلة التوظيف.', 'Add a candidate to the talent pool and start the hiring journey.')}</p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <UserSearch className="size-5" />
        </span>
      </div>

      {state.message ? (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      ) : null}

      <form key={state.ok ? state.message : 'candidate-form'} action={action} className="grid gap-4 md:grid-cols-2" noValidate>
        <Field label={t('الاسم بالكامل', 'Full Name')}>
          <input name="fullName" required className={inputClass} placeholder={t('أحمد محمد علي', 'Ahmed Mohamed Ali')} />
        </Field>

        <Field label={t('رقم الهاتف', 'Phone')}>
          <input name="phone" className={inputClass} placeholder="01xxxxxxxxx" />
        </Field>

        <Field label={t('البريد الإلكتروني', 'Email')}>
          <input name="email" type="email" className={inputClass} placeholder="candidate@email.com" />
        </Field>

        <Field label={t('المنصب المطلوب', 'Applied Position')}>
          <select name="appliedRole" required className={inputClass}>
            <option value="">{t('اختر المنصب', 'Select position')}</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
            {arRoleOptions.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>

        <Field label={t('الشركة الحالية', 'Current Company')}>
          <input name="currentCompany" className={inputClass} placeholder={t('شركة سابقة (اختياري)', 'Previous company (optional)')} />
        </Field>

        <Field label={t('سنوات الخبرة', 'Years of Experience')}>
          <input name="experienceYears" type="number" min={0} max={40} className={inputClass} placeholder="0" />
        </Field>

        <Field label={t('الراتب المتوقع (ج.م)', 'Expected Salary (EGP)')}>
          <input name="expectedSalary" type="number" min={0} step="0.01" className={inputClass} placeholder="0" />
        </Field>

        <Field label={t('مصدر الاستقطاب', 'Source Channel')}>
          <select name="sourceChannel" className={inputClass} defaultValue="manual">
            {sourceOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>

        <div className="md:col-span-2">
          <Field label={t('ملاحظات', 'Notes')}>
            <textarea name="notes" rows={3} className={`${inputClass} h-auto py-2.5`} placeholder={t('أي ملاحظات إضافية...', 'Any additional notes...')} />
          </Field>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
          >
            {pending ? t('جاري الإضافة...', 'Adding...') : t('إضافة إلى مجمع المواهب', 'Add to Talent Pool')}
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
