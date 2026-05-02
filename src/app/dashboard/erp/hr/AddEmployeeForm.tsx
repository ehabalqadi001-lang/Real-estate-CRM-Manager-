'use client'

import { useActionState } from 'react'
import { UserPlus, ShieldCheck, Banknote, Briefcase, HeartPulse, User } from 'lucide-react'
import { createEmployeeAction, type HrActionState } from './actions'

export type DepartmentOption = {
  id: string
  name: string
  name_ar: string | null
  slug: string | null
}

const initialState: HrActionState = { ok: false, message: '' }

// Grouped by department for optgroup rendering
const roleGroups = [
  {
    label: 'المبيعات',
    roles: [
      { value: 'agent',                 label: 'وكيل مبيعات' },
      { value: 'senior_agent',          label: 'وكيل أول' },
      { value: 'team_leader',           label: 'قائد فريق مبيعات' },
      { value: 'branch_manager',        label: 'مدير فرع' },
      { value: 'sales_director',        label: 'مدير مبيعات' },
      { value: 'account_manager',       label: 'مدير حساب' },
      { value: 'buyer_manager',         label: 'مدير مشترين' },
      { value: 'seller_resale_manager', label: 'مدير إعادة بيع' },
      { value: 'broker',                label: 'وسيط عقاري' },
      { value: 'freelancer',            label: 'مستقل' },
    ],
  },
  {
    label: 'المالية',
    roles: [
      { value: 'finance_officer',  label: 'مسؤول مالي' },
      { value: 'finance_manager',  label: 'مدير مالي' },
      { value: 'collection_rep',   label: 'مندوب تحصيل' },
    ],
  },
  {
    label: 'الموارد البشرية',
    roles: [
      { value: 'hr_officer',  label: 'مسؤول موارد بشرية' },
      { value: 'hr_staff',    label: 'موظف موارد بشرية' },
      { value: 'hr_manager',  label: 'مدير موارد بشرية' },
    ],
  },
  {
    label: 'خدمة العملاء',
    roles: [
      { value: 'customer_support', label: 'خدمة عملاء' },
      { value: 'cs_agent',         label: 'وكيل خدمة عملاء' },
      { value: 'cs_supervisor',    label: 'مشرف خدمة عملاء' },
    ],
  },
  {
    label: 'التسويق',
    roles: [
      { value: 'campaign_specialist', label: 'أخصائي حملات' },
      { value: 'marketing_manager',   label: 'مدير تسويق' },
    ],
  },
  {
    label: 'إدخال البيانات والمخزون',
    roles: [
      { value: 'inventory_rep', label: 'مسؤول مخزون' },
      { value: 'data_manager',  label: 'مدير بيانات' },
    ],
  },
  {
    label: 'مراجعة الإعلانات',
    roles: [
      { value: 'ad_reviewer', label: 'مراجع إعلانات' },
      { value: 'ad_manager',  label: 'مدير إعلانات' },
    ],
  },
  {
    label: 'إدارة الحسابات',
    roles: [
      { value: 'users_am',     label: 'مدير حسابات المستخدمين' },
      { value: 'ads_am',       label: 'مدير حسابات الإعلانات' },
      { value: 'am_supervisor',label: 'مشرف إدارة الحسابات' },
    ],
  },
  {
    label: 'الإدارة التنفيذية',
    roles: [
      { value: 'company_admin', label: 'مدير الشركة' },
      { value: 'admin',         label: 'مدير' },
      { value: 'viewer',        label: 'مشاهد فقط' },
    ],
  },
]

export function AddEmployeeForm({ departments }: { departments: DepartmentOption[] }) {
  const [state, action, pending] = useActionState(createEmployeeAction, initialState)

  return (
    <section className="ds-card p-5 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">HR ADMIN HUB</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">إضافة موظف جديد</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            إنشاء حساب دخول آمن، تعيين القسم والراتب والبيانات القانونية من مكان واحد.
          </p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <UserPlus className="size-5" aria-hidden="true" />
        </span>
      </div>

      {/* Feedback */}
      {state.message ? (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${
          state.ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
            : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
        }`}>
          {state.message}
        </div>
      ) : null}

      <form key={state.ok ? state.message : 'employee-form'} action={action} className="space-y-8" noValidate>

        {/* ── Section 1: Personal Info ── */}
        <FormSection icon={<User className="size-4" />} title="البيانات الشخصية">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم بالكامل *">
              <input name="fullName" required className={inputClass} placeholder="مثال: أحمد محمد علي" />
            </Field>
            <Field label="اسم المستخدم *">
              <input
                name="username"
                required
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\s+/g, '').toLowerCase()
                }}
                className={inputClass}
                placeholder="ahmed.ali"
              />
            </Field>
            <Field label="البريد الإلكتروني">
              <input name="email" type="email" className={inputClass} placeholder="ahmed@fastinvestment.com" />
            </Field>
            <Field label="رقم الهاتف">
              <input name="phone" className={inputClass} placeholder="01xxxxxxxxx" />
            </Field>
            <Field label="كلمة المرور *" className="sm:col-span-2">
              <input name="password" type="password" required minLength={8} className={inputClass} placeholder="8 أحرف على الأقل" />
            </Field>
          </div>
        </FormSection>

        {/* ── Section 2: Job Details ── */}
        <FormSection icon={<Briefcase className="size-4" />} title="تفاصيل الوظيفة">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="القسم *">
              <select name="departmentId" required className={selectClass}>
                <option value="">اختر القسم</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name_ar || d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="المسمى الوظيفي *">
              <input name="jobTitle" required className={inputClass} placeholder="مثال: مستشار مبيعات عقارية" />
            </Field>
            <Field label="الدور الوظيفي (الصلاحية) *">
              <select name="role" required defaultValue="agent" className={selectClass}>
                {roleGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.roles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="نوع التوظيف">
              <select name="employmentType" defaultValue="full_time" className={selectClass}>
                <option value="full_time">دوام كامل</option>
                <option value="part_time">دوام جزئي</option>
                <option value="contract">عقد مؤقت</option>
                <option value="intern">متدرب</option>
              </select>
            </Field>
            <Field label="تاريخ التعيين">
              <input name="hireDate" type="date" className={inputClass} defaultValue={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label="نهاية فترة التجربة">
              <input name="probationEndDate" type="date" className={inputClass} />
            </Field>
            <Field label="ملاحظات" className="sm:col-span-2">
              <textarea name="notes" rows={2} className={`${inputClass} h-auto py-2.5`} placeholder="أي ملاحظات إضافية عن الموظف..." />
            </Field>
          </div>
        </FormSection>

        {/* ── Section 3: Financial ── */}
        <FormSection icon={<Banknote className="size-4" />} title="البيانات المالية">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الراتب الأساسي (ج.م)">
              <input name="basicSalary" type="number" min={0} step="0.01" className={inputClass} placeholder="0.00" />
            </Field>
            <Field label="نسبة العمولة (%)">
              <input name="commissionRate" type="number" min={0} max={100} step="0.01" className={inputClass} placeholder="0.00" />
            </Field>
            <Field label="دورة الصرف">
              <select name="payCycle" defaultValue="monthly" className={selectClass}>
                <option value="monthly">شهري</option>
                <option value="biweekly">نصف شهري</option>
                <option value="weekly">أسبوعي</option>
              </select>
            </Field>
            <Field label="رصيد الإجازة السنوية (يوم)">
              <input name="annualLeaveBalance" type="number" min={0} step="0.5" defaultValue="21" className={inputClass} />
            </Field>
            <Field label="اسم البنك">
              <input name="bankName" className={inputClass} placeholder="مثال: بنك مصر" />
            </Field>
            <Field label="اسم صاحب الحساب">
              <input name="bankAccountName" className={inputClass} placeholder="الاسم كما في البنك" />
            </Field>
            <Field label="رقم الحساب البنكي">
              <input name="bankAccountNumber" className={inputClass} placeholder="XXXXXXXXXXXXXXXX" />
            </Field>
            <Field label="الآيبان (IBAN)">
              <input name="bankIban" className={inputClass} placeholder="EG00XXXX..." />
            </Field>
            <Field label="الرقم الضريبي">
              <input name="taxId" className={inputClass} placeholder="الرقم الضريبي (اختياري)" />
            </Field>
            <Field label="رقم التأمين الاجتماعي">
              <input name="socialInsuranceNo" className={inputClass} placeholder="رقم التأمين الاجتماعي" />
            </Field>
          </div>
        </FormSection>

        {/* ── Section 4: Emergency Contact ── */}
        <FormSection icon={<HeartPulse className="size-4" />} title="جهة الاتصال الطارئ">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم جهة الطوارئ">
              <input name="emergencyContactName" className={inputClass} placeholder="مثال: سارة أحمد (زوجة)" />
            </Field>
            <Field label="رقم هاتف الطوارئ">
              <input name="emergencyContactPhone" className={inputClass} placeholder="01xxxxxxxxx" />
            </Field>
          </div>
        </FormSection>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={pending}
          className="fi-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black disabled:opacity-60"
        >
          <ShieldCheck className="size-4" aria-hidden="true" />
          {pending ? 'جاري إنشاء الموظف...' : 'إنشاء الحساب وتفعيل الموظف'}
        </button>
      </form>
    </section>
  )
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 border-b border-[var(--fi-line)] pb-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          {icon}
        </span>
        <h3 className="text-sm font-black text-[var(--fi-ink)]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-black text-[var(--fi-ink)]">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition placeholder:text-[var(--fi-muted)] focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-white/5 dark:focus:ring-emerald-900/30'

const selectClass =
  'h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)] focus:ring-4 focus:ring-emerald-100 dark:bg-slate-900 dark:focus:ring-emerald-900/30'
