'use client'
import { useI18n } from '@/hooks/use-i18n'

import { useActionState } from 'react'
import { GraduationCap } from 'lucide-react'
import { createCourseAction, type AcademyActionState } from './actions'

const initial: AcademyActionState = { ok: false, message: '' }

const categoryOptions = [
  { value: 'sales_skills', label: 'مهارات المبيعات' },
  { value: 'real_estate', label: 'المعرفة العقارية' },
  { value: 'negotiation', label: 'التفاوض والإقناع' },
  { value: 'customer_service', label: 'خدمة العملاء' },
  { value: 'leadership', label: 'القيادة والإدارة' },
  { value: 'compliance', label: 'الامتثال والقوانين' },
  { value: 'technology', label: 'الأدوات التقنية' },
  { value: 'soft_skills', label: 'المهارات الشخصية' },
]

const roleTargets = [
  'Fresh Sales (Level 1)',
  'Sales Advisor (Level 2)',
  'Property Consultant (Level 3)',
  'Senior Property Consultant (Level 4)',
  'Team Leader (Level 6)',
  'Sales Manager (Level 9)',
  'جميع الأقسام',
]

export function CreateCourseForm() {
  const { dir } = useI18n()
  const [state, action, pending] = useActionState(createCourseAction, initial)

  return (
    <section className="ds-card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">L&D ACADEMY</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">إنشاء مقرر تدريبي</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">بناء مكتبة معرفية متكاملة لفريق المبيعات العقارية.</p>
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
          <Field label="عنوان المقرر">
            <input name="title" required className={inputClass} placeholder="أساسيات التسويق العقاري" />
          </Field>
        </div>

        <Field label="الفئة المستهدفة (الدور)">
          <select name="targetRole" className={inputClass}>
            <option value="">جميع الموظفين</option>
            {roleTargets.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>

        <Field label="تصنيف المقرر">
          <select name="category" className={inputClass} defaultValue="sales_skills">
            {categoryOptions.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label="مدة المقرر (ساعات)">
          <input name="durationHours" type="number" min={0.5} step={0.5} className={inputClass} defaultValue={2} />
        </Field>

        <Field label="رابط المحتوى (اختياري)">
          <input name="contentUrl" type="url" className={inputClass} placeholder="https://..." />
        </Field>

        <div className="md:col-span-2">
          <Field label="وصف المقرر">
            <textarea name="description" rows={3} className={`${inputClass} h-auto py-2.5`} placeholder="وصف تفصيلي لمحتوى المقرر وأهدافه..." />
          </Field>
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <input name="isMandatory" type="checkbox" id="mandatory" className="h-4 w-4 rounded border-[var(--fi-line)] accent-[var(--fi-emerald)]" />
          <label htmlFor="mandatory" className="text-sm font-black text-[var(--fi-ink)]">مقرر إلزامي لجميع المستهدفين</label>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
          >
            {pending ? 'جاري الإنشاء...' : 'إنشاء المقرر وإضافته للمكتبة'}
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
