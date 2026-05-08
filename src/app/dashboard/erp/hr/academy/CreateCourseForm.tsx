'use client'
import { useI18n } from '@/hooks/use-i18n'

import { useActionState } from 'react'
import { GraduationCap } from 'lucide-react'
import { createCourseAction, type AcademyActionState } from './actions'

const initial: AcademyActionState = { ok: false, message: '' }

const roleTargetsEn = [
  'Fresh Sales (Level 1)',
  'Sales Advisor (Level 2)',
  'Property Consultant (Level 3)',
  'Senior Property Consultant (Level 4)',
  'Team Leader (Level 6)',
  'Sales Manager (Level 9)',
]

export function CreateCourseForm() {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(createCourseAction, initial)

  const categoryOptions = [
    { value: 'sales_skills',    label: t('مهارات المبيعات', 'Sales Skills') },
    { value: 'real_estate',     label: t('المعرفة العقارية', 'Real Estate Knowledge') },
    { value: 'negotiation',     label: t('التفاوض والإقناع', 'Negotiation & Persuasion') },
    { value: 'customer_service',label: t('خدمة العملاء', 'Customer Service') },
    { value: 'leadership',      label: t('القيادة والإدارة', 'Leadership & Management') },
    { value: 'compliance',      label: t('الامتثال والقوانين', 'Compliance & Regulations') },
    { value: 'technology',      label: t('الأدوات التقنية', 'Technical Tools') },
    { value: 'soft_skills',     label: t('المهارات الشخصية', 'Soft Skills') },
  ]

  const roleTargets = [...roleTargetsEn, t('جميع الأقسام', 'All Departments')]

  return (
    <section className="ds-card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">L&D ACADEMY</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">{t('إنشاء مقرر تدريبي', 'Create Training Course')}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">{t('بناء مكتبة معرفية متكاملة لفريق المبيعات العقارية.', 'Build a comprehensive knowledge library for the real estate sales team.')}</p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <GraduationCap className="size-5" />
        </span>
      </div>

      {state.message ? (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      ) : null}

      <form key={state.ok ? state.message : 'course-form'} action={action} className="grid gap-4 md:grid-cols-2" noValidate>
        <div className="md:col-span-2">
          <Field label={t('عنوان المقرر', 'Course Title')}>
            <input name="title" required className={inputClass} placeholder={t('أساسيات التسويق العقاري', 'Real Estate Marketing Basics')} />
          </Field>
        </div>

        <Field label={t('الفئة المستهدفة (الدور)', 'Target Audience (Role)')}>
          <select name="targetRole" className={inputClass}>
            <option value="">{t('جميع الموظفين', 'All Employees')}</option>
            {roleTargets.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>

        <Field label={t('تصنيف المقرر', 'Course Category')}>
          <select name="category" className={inputClass} defaultValue="sales_skills">
            {categoryOptions.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label={t('مدة المقرر (ساعات)', 'Course Duration (hours)')}>
          <input name="durationHours" type="number" min={0.5} step={0.5} className={inputClass} defaultValue={2} />
        </Field>

        <Field label={t('رابط المحتوى (اختياري)', 'Content URL (optional)')}>
          <input name="contentUrl" type="url" className={inputClass} placeholder="https://..." />
        </Field>

        <div className="md:col-span-2">
          <Field label={t('وصف المقرر', 'Course Description')}>
            <textarea name="description" rows={3} className={`${inputClass} h-auto py-2.5`} placeholder={t('وصف تفصيلي لمحتوى المقرر وأهدافه...', 'Detailed description of course content and objectives...')} />
          </Field>
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <input name="isMandatory" type="checkbox" id="mandatory" className="h-4 w-4 rounded border-[var(--fi-line)] accent-[var(--fi-emerald)]" />
          <label htmlFor="mandatory" className="text-sm font-black text-[var(--fi-ink)]">{t('مقرر إلزامي لجميع المستهدفين', 'Mandatory course for all target audience')}</label>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
          >
            {pending ? t('جاري الإنشاء...', 'Creating...') : t('إنشاء المقرر وإضافته للمكتبة', 'Create Course & Add to Library')}
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
