import { getI18n } from '@/lib/i18n'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Brain,
  CalendarCheck2,
  CalendarDays,
  Download,
  GraduationCap,
  ShieldCheck,
  UserSearch,
  Users,
} from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { AddEmployeeForm, type DepartmentOption } from './AddEmployeeForm'
import { EnvironmentLockButton } from './EnvironmentLockButton'
import { SmartAttendanceWidget, type SmartAttendanceEmployee } from './SmartAttendanceWidget'
import { nullableUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

type EmployeeRow = {
  id: string
  user_id: string | null
  employee_number: string
  department_id: string | null
  job_title: string | null
  hire_date: string | null
  base_salary: number | null
  basic_salary: number | null
  commission_rate: number | null
  status: string | null
  is_env_locked: boolean | null
  allowed_ip: string | null
  profiles:
    | {
        full_name: string | null
        role: string | null
        email: string | null
      }
    | {
        full_name: string | null
        role: string | null
        email: string | null
      }[]
    | null
}

type AttendanceRow = {
  employee_id: string
  check_in: string | null
  check_out: string | null
  status: string | null
}

type PayrollRow = {
  employee_id: string
  total_commissions: number | null
  deductions: number | null
  net_salary: number | null
}

const HR_ROLES: AppRole[] = [
  'super_admin',
  'platform_admin',
  'hr_manager',
  'hr_staff',
  'hr_officer',
  'finance_manager',
]

const HR_WRITE_ROLES: AppRole[] = [
  'super_admin',
  'platform_admin',
  'hr_manager',
  'hr_staff',
  'hr_officer',
]

export default async function ERPHRPage() {
  const { t, numLocale } = await getI18n()
  const formatter = new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 })
  const session = await requireSession()
  const { profile } = session

  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)
  if (!companyId && profile.role !== 'super_admin') redirect('/dashboard')

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const today = now.toISOString().slice(0, 10)

  const departmentsQuery = supabase
    .from('departments')
    .select('id, name, name_ar, slug')
    .in('slug', ['sales', 'finance', 'marketing', 'data-entry', 'customer-service', 'hr'])
    .order('name')

  let employeesQuery = supabase
    .from('employees')
    .select(
      `
        id,
        user_id,
        employee_number,
        department_id,
        job_title,
        hire_date,
        base_salary,
        basic_salary,
        commission_rate,
        status,
        is_env_locked,
        allowed_ip,
        profiles!employees_id_fkey(full_name, role, email)
      `,
    )
    .order('created_at', { ascending: false })

  if (companyId) {
    employeesQuery = employeesQuery.eq('company_id', companyId)
  }

  const [departmentsResult, employeesResult, attendanceResult, payrollResult] = await Promise.all([
    departmentsQuery,
    employeesQuery,
    supabase
      .from('attendance')
      .select('employee_id, check_in, check_out, status')
      .eq('date', today),
    supabase
      .from('payroll')
      .select('employee_id, total_commissions, deductions, net_salary')
      .eq('month', month)
      .eq('year', year),
  ])

  const departments = (departmentsResult.data ?? []) as DepartmentOption[]
  const employees = ((employeesResult.data ?? []) as unknown as EmployeeRow[]).map((employee) => ({
    ...employee,
    profiles: Array.isArray(employee.profiles) ? employee.profiles[0] : employee.profiles,
  }))
  const attendance = (attendanceResult.data ?? []) as AttendanceRow[]
  const payroll = (payrollResult.data ?? []) as PayrollRow[]
  const pageError = departmentsResult.error || employeesResult.error || attendanceResult.error || payrollResult.error
  const canManageHr = HR_WRITE_ROLES.includes(profile.role)
  const canCreateEmployees = canManageHr && Boolean(companyId)

  const attendanceByEmployee = new Map(attendance.map((item) => [item.employee_id, item]))
  const payrollByEmployee = new Map(payroll.map((item) => [item.employee_id, item]))
  const departmentById = new Map(departments.map((department) => [department.id, department]))

  const activeEmployees = employees.filter((employee) => (employee.status ?? 'active') === 'active')
  const lockedEmployees = employees.filter((employee) => employee.is_env_locked).length
  const presentToday = attendance.filter((item) => item.check_in && item.status !== 'blocked').length
  const totalPayroll = payroll.reduce((sum, item) => sum + Number(item.net_salary ?? 0), 0)
  const totalCommissions = payroll.reduce((sum, item) => sum + Number(item.total_commissions ?? 0), 0)

  const selfEmployee = employees.find((employee) => employee.user_id === session.user.id || employee.id === session.user.id)
  const selfAttendance = selfEmployee ? attendanceByEmployee.get(selfEmployee.id) : null
  const smartEmployee: SmartAttendanceEmployee | null = selfEmployee
    ? {
        id: selfEmployee.id,
        fullName: selfEmployee.profiles?.full_name ?? profile.full_name ?? 'موظف',
        jobTitle: selfEmployee.job_title,
        isEnvLocked: Boolean(selfEmployee.is_env_locked),
        todayCheckIn: selfAttendance?.check_in ?? null,
        todayCheckOut: selfAttendance?.check_out ?? null,
      }
    : null

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section className="ds-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">FAST INVESTMENT HRMS</p>
            <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">
              {t('إدارة الموارد البشرية والرواتب', 'HR & Payroll Management')}
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
              {t('مركز موحد لإضافة الموظفين، عزل صلاحيات أقسام HR، ربط بيئة العمل، تسجيل الحضور الذكي، ومتابعة الرواتب والعمولات.', 'Unified hub for adding employees, isolating HR permissions, linking environments, smart attendance, and tracking salaries and commissions.')}
            </p>
          </div>
          <Link
            href={`/api/erp/payroll/preview?month=${month}&year=${year}`}
            target="_blank"
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-4 text-sm font-black text-[var(--fi-ink)] transition hover:border-[var(--fi-emerald)] dark:bg-white/5"
          >
            <Download className="size-4" aria-hidden="true" />
            {t('معاينة رواتب الشهر', 'Preview Monthly Payroll')}
          </Link>
        </div>
      </section>

      {pageError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {t('تعذر تحميل بيانات الموارد البشرية:', 'Failed to load HR data:')} {pageError.message}
        </section>
      ) : null}

      <BentoGrid>
        <BentoKpiCard
          title={t('إجمالي الموظفين النشطين', 'Active Employees')}
          value={<AnimatedCount value={activeEmployees.length} />}
          hint={t('كل الأقسام', 'All departments')}
          icon={<Users className="size-5" />}
        />
        <BentoKpiCard
          title={t('حضور اليوم', "Today's Attendance")}
          value={<AnimatedCount value={presentToday} />}
          hint={`${formatter.format(lockedEmployees)} ${t('بيئة مربوطة', 'linked environments')}`}
          icon={<CalendarCheck2 className="size-5" />}
        />
        <BentoKpiCard
          title={t('صافي الرواتب', 'Net Payroll')}
          value={
            <>
              <AnimatedCount value={totalPayroll} /> <span className="text-base">{t('ج.م', 'EGP')}</span>
            </>
          }
          hint={`${month}/${year}`}
          icon={<BadgeDollarSign className="size-5" />}
        />
        <BentoKpiCard
          title={t('عمولات محتسبة', 'Calculated Commissions')}
          value={
            <>
              <AnimatedCount value={totalCommissions} /> <span className="text-base">{t('ج.م', 'EGP')}</span>
            </>
          }
          hint={t('من payroll', 'from payroll')}
          icon={<BriefcaseBusiness className="size-5" />}
        />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        {canCreateEmployees ? (
          <AddEmployeeForm departments={departments} />
        ) : (
          <section className="ds-card p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">{t('إضافة موظف جديد', 'Add New Employee')}</h2>
            <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
              {t('إنشاء الموظفين متاح لمدير النظام وفريق الموارد البشرية داخل شركة محددة فقط.', 'Employee creation is available to system admins and HR teams within a specific company only.')}
            </p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
              {t('حسابك الحالي غير مرتبط بشركة صالحة. افتح لوحة شركة محددة أو اربط الحقل', 'Your account is not linked to a valid company. Open a specific company panel or link the field')}
              <span className="mx-1 rounded bg-white px-2 py-1 font-mono text-xs">company_id</span>
              {t('قبل إنشاء حسابات موظفين.', 'before creating employee accounts.')}
            </div>
          </section>
        )}

        {smartEmployee ? (
          <SmartAttendanceWidget employee={smartEmployee} />
        ) : (
          <section className="ds-card p-5">
            <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">SMART ATTENDANCE</p>
            <h2 className="mt-2 text-xl font-black text-[var(--fi-ink)]">{t('تسجيل الحضور الذكي', 'Smart Attendance')}</h2>
            <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
              {t('يظهر زر الحضور للحسابات المرتبطة بسجل موظف فقط. مدير النظام يستطيع إدارة السجلات بدون تسجيل حضور شخصي.', 'The attendance button appears only for accounts linked to an employee record. Admins can manage records without personal check-in.')}
            </p>
          </section>
        )}
      </div>

      {/* Module navigation cards */}
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">ENTERPRISE HR MODULES</p>
        <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">{t('وحدات النظام', 'System Modules')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <HrModuleCard
            href="/dashboard/erp/hr/attendance"
            icon={<CalendarDays className="size-5" />}
            color="emerald"
            title={t('الحضور والانصراف', 'Attendance')}
            description={t('رصد لحظي — تقارير شهرية', 'Real-time — Monthly reports')}
          />
          <HrModuleCard
            href="/dashboard/erp/hr/commission"
            icon={<BadgeDollarSign className="size-5" />}
            color="amber"
            title={t('محرك العمولات', 'Commission Engine')}
            description={t('متدرج — ربط بالتحصيل', 'Tiered — linked to collections')}
          />
          <HrModuleCard
            href="/dashboard/erp/hr/talent"
            icon={<UserSearch className="size-5" />}
            color="violet"
            title={t('استقطاب المواهب', 'Talent Acquisition')}
            description={t('قمع التوظيف — خطاب عرض', 'Hiring funnel — Offer letters')}
          />
          <HrModuleCard
            href="/dashboard/erp/hr/academy"
            icon={<GraduationCap className="size-5" />}
            color="blue"
            title={t('أكاديمية التطوير', 'Development Academy')}
            description={t('مقررات — فجوات المهارات', 'Courses — Skill gaps')}
          />
          <HrModuleCard
            href="/dashboard/erp/hr/hrbp"
            icon={<Brain className="size-5" />}
            color="red"
            title={t('الذكاء البشري', 'People Intelligence')}
            description={t('إجهاد — رضا — ثقافة', 'Burnout — Satisfaction — Culture')}
          />
        </div>
      </section>

      <section className="ds-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[var(--fi-line)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-[var(--fi-ink)]">{t('سجل الموظفين', 'Employee Registry')}</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
              {t('الرواتب، الأقسام، حالة البيئة، وحضور اليوم.', 'Salaries, departments, environment status, and today\'s attendance.')}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--fi-soft)] px-3 py-2 text-xs font-black text-[var(--fi-emerald)]">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t('HR فقط', 'HR Only')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">{t('الموظف', 'Employee')}</th>
                <th className="px-4 py-3 text-right">{t('القسم', 'Department')}</th>
                <th className="px-4 py-3 text-right">{t('الدور', 'Role')}</th>
                <th className="px-4 py-3 text-right">{t('الراتب', 'Salary')}</th>
                <th className="px-4 py-3 text-right">{t('العمولة', 'Commission')}</th>
                <th className="px-4 py-3 text-right">{t('حضور اليوم', "Today's Attendance")}</th>
                <th className="px-4 py-3 text-right">{t('بيئة العمل', 'Environment')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {employees.map((employee) => {
                const employeeAttendance = attendanceByEmployee.get(employee.id)
                const employeePayroll = payrollByEmployee.get(employee.id)
                const department = employee.department_id ? departmentById.get(employee.department_id) : null
                return (
                  <tr key={employee.id} className="align-top transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-4">
                      <Link href={`/dashboard/erp/hr/employees/${employee.id}`} className="group/emp block">
                        <p className="font-black text-[var(--fi-ink)] transition group-hover/emp:text-[var(--fi-emerald)]">
                          {employee.profiles?.full_name ?? t('بدون اسم', 'No name')}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">{employee.employee_number}</p>
                        <p className="mt-1 text-xs text-[var(--fi-muted)]">{employee.profiles?.email ?? t('بدون بريد', 'No email')}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-bold text-[var(--fi-ink)]">
                      {department?.name_ar ?? department?.name ?? t('غير محدد', 'N/A')}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-[var(--fi-ink)]">{employee.job_title ?? t('غير محدد', 'N/A')}</p>
                      <p className="mt-1 text-xs text-[var(--fi-muted)]">{labelRole(employee.profiles?.role)}</p>
                    </td>
                    <td className="px-4 py-4 font-black text-[var(--fi-ink)]">
                      {formatter.format(Number(employee.basic_salary ?? employee.base_salary ?? employeePayroll?.net_salary ?? 0))} {t('ج.م', 'EGP')}
                    </td>
                    <td className="px-4 py-4 font-black text-emerald-600">
                      {formatter.format(Number(employeePayroll?.total_commissions ?? 0))} {t('ج.م', 'EGP')}
                      <span className="mt-1 block text-xs text-[var(--fi-muted)]">{Number(employee.commission_rate ?? 0)}%</span>
                    </td>
                    <td className="px-4 py-4">
                      <AttendanceBadge attendance={employeeAttendance} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="mb-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            employee.is_env_locked
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {employee.is_env_locked ? t('مربوطة', 'Linked') : t('غير مربوطة', 'Unlinked')}
                        </span>
                      </div>
                      {canManageHr ? <EnvironmentLockButton employeeId={employee.id} locked={Boolean(employee.is_env_locked)} /> : null}
                    </td>
                  </tr>
                )
              })}
              {!employees.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm font-bold text-[var(--fi-muted)]">
                    {t('لا يوجد موظفون حتى الآن. استخدم نموذج إضافة موظف لإنشاء أول حساب داخل شركة مرتبطة.', 'No employees yet. Use the add employee form to create the first account within a linked company.')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function AttendanceBadge({ attendance }: { attendance: AttendanceRow | undefined }) {
  if (!attendance) {
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">لم يسجل</span>
  }

  if (attendance.status === 'blocked') {
    return <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">خارج النطاق</span>
  }

  return (
    <div>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">حاضر</span>
      <p className="mt-2 text-xs font-bold text-[var(--fi-muted)]">
        {formatTime(attendance.check_in)} - {formatTime(attendance.check_out)}
      </p>
    </div>
  )
}

function formatTime(value: string | null | undefined, locale = 'ar-EG') {
  if (!value) return '...'
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function labelRole(role: string | null | undefined) {
  const labels: Record<string, string> = {
    super_admin: 'مدير النظام',
    platform_admin: 'مدير المنصة',
    company_owner: 'مالك الشركة',
    company_admin: 'مدير الشركة',
    branch_manager: 'مدير فرع',
    senior_agent: 'وكيل أول',
    agent: 'وكيل مبيعات',
    finance_officer: 'مسؤول مالي',
    finance_manager: 'مدير مالي',
    hr_manager: 'مدير موارد بشرية',
    hr_staff: 'موظف موارد بشرية',
    hr_officer: 'مسؤول موارد بشرية',
    customer_support: 'خدمة عملاء',
    marketing_manager: 'مدير تسويق',
    inventory_rep: 'إدخال بيانات',
    data_manager: 'مدير بيانات',
    viewer: 'مشاهد',
  }

  return labels[role ?? ''] ?? role ?? 'غير محدد'
}

type ModuleColor = 'emerald' | 'amber' | 'violet' | 'blue' | 'red'

const colorMap: Record<ModuleColor, { icon: string; title: string; border: string }> = {
  emerald: { icon: 'bg-emerald-50 text-emerald-600', title: 'text-emerald-700', border: 'hover:border-emerald-300' },
  amber:   { icon: 'bg-amber-50 text-amber-600',   title: 'text-amber-700',   border: 'hover:border-amber-300' },
  violet:  { icon: 'bg-violet-50 text-violet-600', title: 'text-violet-700',  border: 'hover:border-violet-300' },
  blue:    { icon: 'bg-blue-50 text-blue-600',     title: 'text-blue-700',    border: 'hover:border-blue-300' },
  red:     { icon: 'bg-red-50 text-red-600',       title: 'text-red-700',     border: 'hover:border-red-300' },
}

function HrModuleCard({
  href,
  icon,
  color,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  color: ModuleColor
  title: string
  description: string
}) {
  const c = colorMap[color]
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 rounded-xl border border-[var(--fi-line)] bg-white p-4 transition hover:shadow-md dark:bg-white/5 ${c.border}`}
    >
      <span className={`flex size-10 items-center justify-center rounded-lg ${c.icon}`}>{icon}</span>
      <div>
        <p className={`text-sm font-black ${c.title}`}>{title}</p>
        <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">{description}</p>
      </div>
    </Link>
  )
}
