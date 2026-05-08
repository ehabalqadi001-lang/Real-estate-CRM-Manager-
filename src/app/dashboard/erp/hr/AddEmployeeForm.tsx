'use client'

import { useActionState } from 'react'
import { UserPlus, ShieldCheck, Banknote, Briefcase, HeartPulse, User } from 'lucide-react'
import { createEmployeeAction, type HrActionState } from './actions'
import { useI18n } from '@/hooks/use-i18n'

export type DepartmentOption = {
  id: string
  name: string
  name_ar: string | null
  slug: string | null
}

const initialState: HrActionState = { ok: false, message: '' }

export function AddEmployeeForm({ departments }: { departments: DepartmentOption[] }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(createEmployeeAction, initialState)

  const roleGroups = [
    {
      label: t('المبيعات', 'Sales'),
      roles: [
        { value: 'agent',                 label: t('وكيل مبيعات', 'Sales Agent') },
        { value: 'senior_agent',          label: t('وكيل أول', 'Senior Agent') },
        { value: 'team_leader',           label: t('قائد فريق مبيعات', 'Sales Team Leader') },
        { value: 'branch_manager',        label: t('مدير فرع', 'Branch Manager') },
        { value: 'sales_director',        label: t('مدير مبيعات', 'Sales Director') },
        { value: 'account_manager',       label: t('مدير حساب', 'Account Manager') },
        { value: 'buyer_manager',         label: t('مدير مشترين', 'Buyer Manager') },
        { value: 'seller_resale_manager', label: t('مدير إعادة بيع', 'Resale Manager') },
        { value: 'broker',                label: t('وسيط عقاري', 'Real Estate Broker') },
        { value: 'freelancer',            label: t('مستقل', 'Freelancer') },
      ],
    },
    {
      label: t('المالية', 'Finance'),
      roles: [
        { value: 'finance_officer',  label: t('مسؤول مالي', 'Finance Officer') },
        { value: 'finance_manager',  label: t('مدير مالي', 'Finance Manager') },
        { value: 'collection_rep',   label: t('مندوب تحصيل', 'Collection Representative') },
      ],
    },
    {
      label: t('الموارد البشرية', 'Human Resources'),
      roles: [
        { value: 'hr_officer',  label: t('مسؤول موارد بشرية', 'HR Officer') },
        { value: 'hr_staff',    label: t('موظف موارد بشرية', 'HR Staff') },
        { value: 'hr_manager',  label: t('مدير موارد بشرية', 'HR Manager') },
      ],
    },
    {
      label: t('خدمة العملاء', 'Customer Service'),
      roles: [
        { value: 'customer_support', label: t('خدمة عملاء', 'Customer Support') },
        { value: 'cs_agent',         label: t('وكيل خدمة عملاء', 'CS Agent') },
        { value: 'cs_supervisor',    label: t('مشرف خدمة عملاء', 'CS Supervisor') },
      ],
    },
    {
      label: t('التسويق', 'Marketing'),
      roles: [
        { value: 'campaign_specialist', label: t('أخصائي حملات', 'Campaign Specialist') },
        { value: 'marketing_manager',   label: t('مدير تسويق', 'Marketing Manager') },
      ],
    },
    {
      label: t('إدخال البيانات والمخزون', 'Data Entry & Inventory'),
      roles: [
        { value: 'inventory_rep', label: t('مسؤول مخزون', 'Inventory Officer') },
        { value: 'data_manager',  label: t('مدير بيانات', 'Data Manager') },
      ],
    },
    {
      label: t('مراجعة الإعلانات', 'Ad Review'),
      roles: [
        { value: 'ad_reviewer', label: t('مراجع إعلانات', 'Ad Reviewer') },
        { value: 'ad_manager',  label: t('مدير إعلانات', 'Ad Manager') },
      ],
    },
    {
      label: t('إدارة الحسابات', 'Account Management'),
      roles: [
        { value: 'users_am',     label: t('مدير حسابات المستخدمين', 'User Accounts Manager') },
        { value: 'ads_am',       label: t('مدير حسابات الإعلانات', 'Ads Accounts Manager') },
        { value: 'am_supervisor',label: t('مشرف إدارة الحسابات', 'AM Supervisor') },
      ],
    },
    {
      label: t('الإدارة التنفيذية', 'Executive Management'),
      roles: [
        { value: 'company_admin', label: t('مدير الشركة', 'Company Admin') },
        { value: 'admin',         label: t('مدير', 'Admin') },
        { value: 'viewer',        label: t('مشاهد فقط', 'Viewer Only') },
      ],
    },
  ]

  return (
    <section className="ds-card p-5 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">HR ADMIN HUB</p>
          <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">{t('إضافة موظف جديد', 'Add New Employee')}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            {t('إنشاء حساب دخول آمن، تعيين القسم والراتب والبيانات القانونية من مكان واحد.', 'Create a secure login, assign department, salary, and legal info in one place.')}
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
        <FormSection icon={<User className="size-4" />} title={t('البيانات الشخصية', 'Personal Info')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('الاسم بالكامل *', 'Full Name *')}>
              <input name="fullName" required className={inputClass} placeholder={t('مثال: أحمد محمد علي', 'e.g. Ahmed Mohamed Ali')} />
            </Field>
            <Field label={t('اسم المستخدم *', 'Username *')}>
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
            <Field label={t('البريد الإلكتروني', 'Email')}>
              <input name="email" type="email" className={inputClass} placeholder="ahmed@fastinvestment.com" />
            </Field>
            <Field label={t('رقم الهاتف', 'Phone')}>
              <input name="phone" className={inputClass} placeholder="01xxxxxxxxx" />
            </Field>
            <Field label={t('كلمة المرور *', 'Password *')} className="sm:col-span-2">
              <input name="password" type="password" required minLength={8} className={inputClass} placeholder={t('8 أحرف على الأقل', 'At least 8 characters')} />
            </Field>
          </div>
        </FormSection>

        {/* ── Section 2: Job Details ── */}
        <FormSection icon={<Briefcase className="size-4" />} title={t('تفاصيل الوظيفة', 'Job Details')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('القسم *', 'Department *')}>
              <select name="departmentId" required className={selectClass}>
                <option value="">{t('اختر القسم', 'Select department')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name_ar || d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('المسمى الوظيفي *', 'Job Title *')}>
              <input name="jobTitle" required className={inputClass} placeholder={t('مثال: مستشار مبيعات عقارية', 'e.g. Real Estate Sales Consultant')} />
            </Field>
            <Field label={t('الدور الوظيفي (الصلاحية) *', 'Role (Permission) *')}>
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
            <Field label={t('نوع التوظيف', 'Employment Type')}>
              <select name="employmentType" defaultValue="full_time" className={selectClass}>
                <option value="full_time">{t('دوام كامل', 'Full-time')}</option>
                <option value="part_time">{t('دوام جزئي', 'Part-time')}</option>
                <option value="contract">{t('عقد مؤقت', 'Contract')}</option>
                <option value="intern">{t('متدرب', 'Intern')}</option>
              </select>
            </Field>
            <Field label={t('تاريخ التعيين', 'Hire Date')}>
              <input name="hireDate" type="date" className={inputClass} defaultValue={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label={t('نهاية فترة التجربة', 'Probation End Date')}>
              <input name="probationEndDate" type="date" className={inputClass} />
            </Field>
            <Field label={t('ملاحظات', 'Notes')} className="sm:col-span-2">
              <textarea name="notes" rows={2} className={`${inputClass} h-auto py-2.5`} placeholder={t('أي ملاحظات إضافية عن الموظف...', 'Any additional notes about the employee...')} />
            </Field>
          </div>
        </FormSection>

        {/* ── Section 3: Financial ── */}
        <FormSection icon={<Banknote className="size-4" />} title={t('البيانات المالية', 'Financial Info')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('الراتب الأساسي (ج.م)', 'Basic Salary (EGP)')}>
              <input name="basicSalary" type="number" min={0} step="0.01" className={inputClass} placeholder="0.00" />
            </Field>
            <Field label={t('نسبة العمولة (%)', 'Commission Rate (%)')}>
              <input name="commissionRate" type="number" min={0} max={100} step="0.01" className={inputClass} placeholder="0.00" />
            </Field>
            <Field label={t('دورة الصرف', 'Pay Cycle')}>
              <select name="payCycle" defaultValue="monthly" className={selectClass}>
                <option value="monthly">{t('شهري', 'Monthly')}</option>
                <option value="biweekly">{t('نصف شهري', 'Bi-weekly')}</option>
                <option value="weekly">{t('أسبوعي', 'Weekly')}</option>
              </select>
            </Field>
            <Field label={t('رصيد الإجازة السنوية (يوم)', 'Annual Leave Balance (days)')}>
              <input name="annualLeaveBalance" type="number" min={0} step="0.5" defaultValue="21" className={inputClass} />
            </Field>
            <Field label={t('اسم البنك', 'Bank Name')}>
              <input name="bankName" className={inputClass} placeholder={t('مثال: بنك مصر', 'e.g. Bank of Egypt')} />
            </Field>
            <Field label={t('اسم صاحب الحساب', 'Account Holder Name')}>
              <input name="bankAccountName" className={inputClass} placeholder={t('الاسم كما في البنك', 'Name as in bank')} />
            </Field>
            <Field label={t('رقم الحساب البنكي', 'Bank Account Number')}>
              <input name="bankAccountNumber" className={inputClass} placeholder="XXXXXXXXXXXXXXXX" />
            </Field>
            <Field label={t('الآيبان (IBAN)', 'IBAN')}>
              <input name="bankIban" className={inputClass} placeholder="EG00XXXX..." />
            </Field>
            <Field label={t('الرقم الضريبي', 'Tax ID')}>
              <input name="taxId" className={inputClass} placeholder={t('الرقم الضريبي (اختياري)', 'Tax ID (optional)')} />
            </Field>
            <Field label={t('رقم التأمين الاجتماعي', 'Social Insurance No.')}>
              <input name="socialInsuranceNo" className={inputClass} placeholder={t('رقم التأمين الاجتماعي', 'Social Insurance Number')} />
            </Field>
          </div>
        </FormSection>

        {/* ── Section 4: Emergency Contact ── */}
        <FormSection icon={<HeartPulse className="size-4" />} title={t('جهة الاتصال الطارئ', 'Emergency Contact')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('اسم جهة الطوارئ', 'Emergency Contact Name')}>
              <input name="emergencyContactName" className={inputClass} placeholder={t('مثال: سارة أحمد (زوجة)', 'e.g. Sara Ahmed (spouse)')} />
            </Field>
            <Field label={t('رقم هاتف الطوارئ', 'Emergency Phone')}>
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
          {pending ? t('جاري إنشاء الموظف...', 'Creating employee...') : t('إنشاء الحساب وتفعيل الموظف', 'Create Account & Activate Employee')}
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
