'use client'

import { useActionState, useEffect, useState } from 'react'
import { UserPlus, ShieldCheck } from 'lucide-react'
import { createEmployeeAction, type HrActionState } from './actions'

export type DepartmentOption = {
  id: string
  name: string
  name_ar: string | null
  slug: string | null
}

const initialState: HrActionState = { ok: false, message: '' }

const roleOptions = [
  { value: 'agent', label: 'وكيل مبيعات' },
  { value: 'senior_agent', label: 'وكيل أول' },
  { value: 'branch_manager', label: 'مدير فرع' },
  { value: 'finance_officer', label: 'مسؤول مالي' },
  { value: 'finance_manager', label: 'مدير مالي' },
  { value: 'hr_manager', label: 'مدير موارد بشرية' },
  { value: 'hr_staff', label: 'موظف موارد بشرية' },
  { value: 'customer_support', label: 'خدمة عملاء' },
  { value: 'marketing_manager', label: 'مدير تسويق' },
  { value: 'campaign_specialist', label: 'أخصائي حملات' },
  { value: 'inventory_rep', label: 'إدخال بيانات' },
  { value: 'data_manager', label: 'مدير بيانات' },
  { value: 'viewer', label: 'مشاهد' },
]

export function AddEmployeeForm({ departments }: { departments: DepartmentOption[] }) {
  const [state, action, pending] = useActionState(createEmployeeAction, initialState)
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (state.ok) setUsername('')
  }, [state.ok])

  return (
    <section className="ds-card ds-card-hover p-5" dir="rtl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">HR ADMIN HUB</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">إضافة موظف جديد</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            إنشاء حساب دخول آمن وتعيين القسم والراتب والصلاحية من مكان واحد.
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <UserPlus className="size-5" aria-hidden="true" />
        </span>
      </div>

      {state.message ? (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-bold ${
          state.ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {state.message}
        </div>
      ) : null}

      <form action={action} className="grid gap-4 md:grid-cols-2" noValidate>
        <Field label="اسم الموظف بالكامل">
          <input name="fullName" required className={inputClass} placeholder="مثال: EHAB MOHAMED ALQADI" />
        </Field>

        <Field label="اسم المستخدم">
          <input
            name="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value.replace(/\s+/g, '').toLowerCase())}
            className={inputClass}
            placeholder="ehab.alqadi"
          />
        </Field>

        <Field label="البريد الإلكتروني">
          <input name="email" type="email" className={inputClass} placeholder="employee@fastinvestment.com" />
        </Field>

        <Field label="رقم الهاتف">
          <input name="phone" className={inputClass} placeholder="01xxxxxxxxx" />
        </Field>

        <Field label="كلمة المرور">
          <input name="password" type="password" required minLength={8} className={inputClass} placeholder="8 أحرف على الأقل" />
        </Field>

        <Field label="القسم">
          <select name="departmentId" required className={inputClass}>
            <option value="">اختر القسم</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name_ar || department.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="الدور الوظيفي">
          <select name="role" required defaultValue="agent" className={inputClass}>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </Field>

        <Field label="المسمى الوظيفي">
          <input name="jobTitle" required className={inputClass} placeholder="مثال: مستشار مبيعات عقارية" />
        </Field>

        <Field label="الراتب الأساسي">
          <input name="basicSalary" type="number" min={0} step="0.01" className={inputClass} placeholder="0" />
        </Field>

        <Field label="نسبة العمولة">
          <input name="commissionRate" type="number" min={0} step="0.01" className={inputClass} placeholder="0" />
        </Field>

        <Field label="تاريخ التعيين">
          <input name="hireDate" type="date" className={inputClass} defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            {pending ? 'جاري إنشاء الموظف...' : 'إنشاء الحساب وتفعيل الموظف'}
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
