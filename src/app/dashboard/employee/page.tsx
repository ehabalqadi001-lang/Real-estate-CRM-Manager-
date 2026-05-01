import { BadgeDollarSign, BookOpen, CalendarDays, CheckCircle2, ClipboardList, FileDown, FileText, ShieldCheck, Star, Trophy } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { SmartAttendanceWidget, type SmartAttendanceEmployee } from '../erp/hr/SmartAttendanceWidget'
import { PulseForm } from '../erp/hr/hrbp/PulseForm'
import { LeaveRequestForm, type LeaveTypeOption } from './LeaveRequestForm'

export const dynamic = 'force-dynamic'

type EmployeeRow = {
  id: string
  user_id: string | null
  job_title: string | null
  basic_salary: number | null
  base_salary: number | null
  is_env_locked: boolean | null
  profiles: { full_name: string | null; email: string | null } | null
}

type AttendanceRow = {
  date: string
  check_in: string | null
  check_out: string | null
  status: string | null
}

type PayrollRow = {
  month: number
  year: number
  basic_salary: number | null
  total_commissions: number | null
  deductions: number | null
  net_salary: number | null
  status: string | null
  present_days: number | null
  absent_days: number | null
}

type DealRow = {
  deal_ref: string
  sale_value: number
  commission_amount: number
  triggered_commission: number
  deal_stage: string
  status: string
  created_at: string
}

type EnrollmentRow = {
  status: string
  score: number | null
  enrolled_at: string
  completed_at: string | null
  learning_courses: { title: string; category: string; duration_hours: number } | null
}

const formatter = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })
const timeFormatter = new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit' })
const dateFormatter = new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short' })

const dealStatusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
}
const dealStatusLabel: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'مُقرَّرة',
  rejected: 'مرفوضة',
}
const courseStatusBadge: Record<string, string> = {
  enrolled: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  dropped: 'bg-slate-100 text-slate-600',
}
const courseStatusLabel: Record<string, string> = {
  enrolled: 'مسجّل',
  in_progress: 'قيد التعلم',
  completed: 'مكتمل',
  dropped: 'متوقف',
}
const categoryLabel: Record<string, string> = {
  sales_skills: 'مهارات مبيعات',
  real_estate: 'معرفة عقارية',
  negotiation: 'تفاوض',
  customer_service: 'خدمة عملاء',
  leadership: 'قيادة',
  compliance: 'امتثال',
  technology: 'تقنية',
  soft_skills: 'مهارات شخصية',
}

export default async function EmployeePortalPage() {
  const session = await requireSession()
  const supabase = await createRawClient()
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { data: employeeData } = await supabase
    .from('employees')
    .select('id, user_id, job_title, basic_salary, base_salary, is_env_locked, profiles!employees_id_fkey(full_name, email)')
    .or(`user_id.eq.${session.user.id},id.eq.${session.user.id}`)
    .maybeSingle()

  const employee = employeeData as unknown as EmployeeRow | null
  const empProfile = employee
    ? (Array.isArray(employee.profiles) ? employee.profiles[0] : employee.profiles)
    : null

  const companyId = (employeeData as any)?.company_id ?? null

  const leaveTypesQuery = supabase
    .from('leave_types')
    .select('id, name, name_ar, days_per_year, is_paid')
    .eq('is_active', true)

  const [
    attendanceResult, payrollResult, dealsResult, enrollmentsResult,
    leaveTypesResult, myLeavesResult, onboardingResult, docsResult, reviewsResult,
    leaveBalancesResult,
  ] = employee
    ? await Promise.all([
        supabase
          .from('attendance')
          .select('date, check_in, check_out, status')
          .eq('employee_id', employee.id)
          .order('date', { ascending: false })
          .limit(30),
        supabase
          .from('payroll')
          .select('month, year, basic_salary, total_commissions, deductions, net_salary, status, present_days, absent_days')
          .eq('employee_id', employee.id)
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(6),
        supabase
          .from('commission_deals')
          .select('deal_ref, sale_value, commission_amount, triggered_commission, deal_stage, status, created_at')
          .eq('employee_id', employee.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('course_enrollments')
          .select('status, score, enrolled_at, completed_at, learning_courses!course_enrollments_course_id_fkey(title, category, duration_hours)')
          .eq('employee_id', employee.id)
          .order('enrolled_at', { ascending: false }),
        leaveTypesQuery,
        supabase
          .from('leave_requests')
          .select('id, start_date, end_date, days_count, status, manager_notes, leave_types!leave_requests_leave_type_id_fkey(name_ar)')
          .eq('employee_id', employee.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('onboarding_tasks')
          .select('id, task_title, completed_at, due_date, order_index')
          .eq('employee_id', employee.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('employee_documents')
          .select('id, doc_type, title, file_path, file_name, expiry_date, verified, created_at')
          .eq('employee_id', employee.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('performance_reviews')
          .select('id, period_label, review_cycle, final_score, rating_label, promotion_flag, status')
          .eq('employee_id', employee.id)
          .order('period_start', { ascending: false })
          .limit(6),
        supabase
          .from('leave_balances')
          .select('total_days, used_days, pending_days, leave_types!leave_balances_leave_type_id_fkey(name_ar)')
          .eq('employee_id', employee.id)
          .eq('year', year),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ]

  const attendanceRows = (attendanceResult.data ?? []) as AttendanceRow[]
  const payrollHistory = (payrollResult.data ?? []) as PayrollRow[]
  const payroll = payrollHistory[0] ?? null
  const deals = ((dealsResult.data ?? []) as unknown as DealRow[])
  const enrollments = ((enrollmentsResult.data ?? []) as unknown as EnrollmentRow[]).map((e) => ({
    ...e,
    learning_courses: Array.isArray(e.learning_courses) ? e.learning_courses[0] : e.learning_courses,
  }))
  const leaveTypes = (leaveTypesResult.data ?? []) as LeaveTypeOption[]
  type MyLeaveRow = {
    id: string; start_date: string; end_date: string; days_count: number; status: string
    manager_notes: string | null
    leave_types: { name_ar: string | null } | { name_ar: string | null }[] | null
  }
  const myLeaves = ((myLeavesResult.data ?? []) as unknown as MyLeaveRow[]).map((l) => ({
    ...l,
    leave_types: Array.isArray(l.leave_types) ? l.leave_types[0] : l.leave_types,
  }))

  const onboardingTasks = ((onboardingResult.data ?? []) as Array<{
    id: string; task_title: string; completed_at: string | null; due_date: string | null; order_index: number
  }>)
  const onboardingPct = onboardingTasks.length
    ? Math.round((onboardingTasks.filter((t) => t.completed_at !== null).length / onboardingTasks.length) * 100)
    : null

  const myDocs = (docsResult.data ?? []) as Array<{
    id: string; doc_type: string; title: string; file_path: string | null
    file_name: string | null; expiry_date: string | null; verified: boolean
  }>

  const myReviews = (reviewsResult.data ?? []) as Array<{
    id: string; period_label: string; review_cycle: string
    final_score: number | null; rating_label: string | null
    promotion_flag: boolean; status: string
  }>

  type LeaveBalanceRow = {
    total_days: number; used_days: number; pending_days: number
    leave_types: { name_ar: string | null } | { name_ar: string | null }[] | null
  }
  const leaveBalances = ((leaveBalancesResult.data ?? []) as unknown as LeaveBalanceRow[]).map(lb => ({
    ...lb,
    leave_types: Array.isArray(lb.leave_types) ? lb.leave_types[0] : lb.leave_types,
  }))

  const todayAttendance = attendanceRows.find((row) => row.date === today)
  const presentDays = attendanceRows.filter((row) => row.check_in && row.status !== 'blocked').length
  const blockedDays = attendanceRows.filter((row) => row.status === 'blocked').length
  const totalCommissions = deals.filter((d) => d.status === 'approved').reduce((s, d) => s + Number(d.triggered_commission), 0)
  const completedCourses = enrollments.filter((e) => e.status === 'completed').length

  const smartEmployee: SmartAttendanceEmployee | null = employee
    ? {
        id: employee.id,
        fullName: empProfile?.full_name ?? session.profile.full_name ?? 'موظف',
        jobTitle: employee.job_title,
        isEnvLocked: Boolean(employee.is_env_locked),
        todayCheckIn: todayAttendance?.check_in ?? null,
        todayCheckOut: todayAttendance?.check_out ?? null,
      }
    : null

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">EMPLOYEE SELF-SERVICE</p>
            <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)]">
              مرحباً، {empProfile?.full_name ?? session.profile.full_name ?? 'موظف'}
            </h1>
            <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
              {employee?.job_title ?? 'بوابة الموظف'} — حضورك، راتبك، عمولاتك، ومساراتك التعليمية.
            </p>
          </div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ${employee?.is_env_locked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            <ShieldCheck className="size-4" />
            {employee?.is_env_locked ? 'بيئة العمل مربوطة' : 'في انتظار ربط البيئة'}
          </span>
        </div>
      </section>

      <BentoGrid>
        <BentoKpiCard
          title="أيام الحضور"
          value={<AnimatedCount value={presentDays} />}
          hint="آخر 30 يوم"
          icon={<CalendarDays className="size-5" />}
        />
        <BentoKpiCard
          title="عمولات مُقرَّرة"
          value={<><AnimatedCount value={totalCommissions} /> <span className="text-base">ج.م</span></>}
          hint="هذا الشهر"
          icon={<BadgeDollarSign className="size-5" />}
        />
        <BentoKpiCard
          title="صافي المستحق"
          value={<><AnimatedCount value={Number(payroll?.net_salary ?? employee?.basic_salary ?? employee?.base_salary ?? 0)} /> <span className="text-base">ج.م</span></>}
          hint={payroll?.status === 'approved' ? 'مُقرَّر' : 'تقديري'}
          icon={<FileDown className="size-5" />}
        />
        <BentoKpiCard
          title="مقررات مكتملة"
          value={<AnimatedCount value={completedCourses} />}
          hint={`${enrollments.length} مسجّل`}
          icon={<BookOpen className="size-5" />}
        />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
        <SmartAttendanceWidget employee={smartEmployee} />

        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">سجل الحضور — آخر 30 يوم</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">الحضور</th>
                  <th className="px-4 py-3 text-right">الانصراف</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {attendanceRows.map((row) => (
                  <tr key={row.date} className="hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{dateFormatter.format(new Date(row.date))}</td>
                    <td className="px-4 py-3 text-[var(--fi-muted)]">{row.check_in ? timeFormatter.format(new Date(row.check_in)) : '—'}</td>
                    <td className="px-4 py-3 text-[var(--fi-muted)]">{row.check_out ? timeFormatter.format(new Date(row.check_out)) : '—'}</td>
                    <td className="px-4 py-3">{labelStatus(row.status)}</td>
                  </tr>
                ))}
                {!attendanceRows.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center font-bold text-[var(--fi-muted)]">
                      لا يوجد سجل حضور بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--fi-line)] p-4 text-center">
            <p className="text-xs font-bold text-[var(--fi-muted)]">
              صافي الشهر الحالي:{' '}
              <span className="font-black text-[var(--fi-ink)]">
                {formatter.format(Number(payroll?.net_salary ?? 0))} ج.م
              </span>
              {payroll?.status && (
                <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-black ${payroll.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {payroll.status === 'approved' ? 'مُقرَّر' : 'مسودة'}
                </span>
              )}
            </p>
          </div>
        </section>
      </div>

      {/* Commission deals */}
      {deals.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">صفقاتي وعمولاتي</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">رقم الصفقة</th>
                  <th className="px-4 py-3 text-right">قيمة البيع</th>
                  <th className="px-4 py-3 text-right">عمولة محتسبة</th>
                  <th className="px-4 py-3 text-right">عمولة مُفعَّلة</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {deals.map((deal, i) => (
                  <tr key={i} className="transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{deal.deal_ref}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{formatter.format(deal.sale_value)} ج.م</td>
                    <td className="px-4 py-3 font-bold text-amber-600">{formatter.format(deal.commission_amount)} ج.م</td>
                    <td className="px-4 py-3 font-black text-emerald-600">{formatter.format(deal.triggered_commission)} ج.م</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${dealStatusBadge[deal.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {dealStatusLabel[deal.status] ?? deal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Learning path */}
      {enrollments.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">مساري التعليمي</h2>
            <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--fi-muted)]">
              <Trophy className="size-4 text-amber-500" />
              {completedCourses}/{enrollments.length} مكتمل
            </span>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {enrollments.map((enrollment, i) => {
              const course = enrollment.learning_courses
              return (
                <div key={i} className="flex items-center justify-between gap-4 p-4 transition hover:bg-[var(--fi-soft)]/60">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <BookOpen className="size-4" />
                    </span>
                    <div>
                      <p className="font-black text-[var(--fi-ink)]">{course?.title ?? 'مقرر'}</p>
                      <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">
                        {categoryLabel[course?.category ?? ''] ?? course?.category} — {course?.duration_hours}س
                        {enrollment.score != null && ` — درجة: ${enrollment.score}/100`}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${courseStatusBadge[enrollment.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {courseStatusLabel[enrollment.status] ?? enrollment.status}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Leave requests */}
      {employee && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
          <LeaveRequestForm employeeId={employee.id} leaveTypes={leaveTypes} />

          {myLeaves.length > 0 && (
            <section className="ds-card overflow-hidden">
              <div className="border-b border-[var(--fi-line)] p-5">
                <h2 className="text-xl font-black text-[var(--fi-ink)]">طلبات إجازاتي</h2>
              </div>
              <div className="divide-y divide-[var(--fi-line)]">
                {myLeaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-black text-[var(--fi-ink)]">{l.leave_types?.name_ar ?? 'إجازة'}</p>
                      <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">
                        {new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short' }).format(new Date(l.start_date))}
                        {' — '}
                        {new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short' }).format(new Date(l.end_date))}
                        {' · '}{l.days_count} يوم
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                      l.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      l.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      l.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {l.status === 'approved' ? 'مُقرَّرة' : l.status === 'rejected' ? 'مرفوضة' : l.status === 'cancelled' ? 'ملغاة' : 'قيد المراجعة'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Leave balance */}
      {leaveBalances.length > 0 && (
        <section className="ds-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">LEAVE BALANCE</p>
              <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">رصيدي من الإجازات</h2>
            </div>
            <CalendarDays className="size-5 text-[var(--fi-muted)]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leaveBalances.map((lb, i) => {
              const used      = Number(lb.used_days)
              const total     = Number(lb.total_days)
              const pending   = Number(lb.pending_days)
              const remaining = Math.max(total - used - pending, 0)
              const pct       = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0
              return (
                <div key={i} className="rounded-xl border border-[var(--fi-line)] p-4">
                  <p className="font-black text-[var(--fi-ink)]">{lb.leave_types?.name_ar ?? 'إجازة'}</p>
                  <div className="mt-3 mb-1.5 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                    <div
                      className="h-2 rounded-full bg-[var(--fi-emerald)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--fi-muted)]">
                    <span>{used} يوم مستخدم</span>
                    <span className="font-black text-[var(--fi-ink)]">{remaining} يوم متبقي</span>
                  </div>
                  {pending > 0 && (
                    <p className="mt-1.5 text-xs font-bold text-amber-600">{pending} يوم قيد الموافقة</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Payroll history */}
      {payrollHistory.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">PAYSLIPS</p>
            <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">كشوف راتبي</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">الشهر</th>
                  <th className="px-4 py-3 text-right">الأساسي</th>
                  <th className="px-4 py-3 text-right">عمولات</th>
                  <th className="px-4 py-3 text-right">استقطاعات</th>
                  <th className="px-4 py-3 text-right">الصافي</th>
                  <th className="px-4 py-3 text-right">الحضور</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {payrollHistory.map((p) => (
                  <tr key={`${p.month}-${p.year}`} className="transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">
                      {new Intl.DateTimeFormat('ar-EG', { month: 'short', year: 'numeric' }).format(new Date(p.year, p.month - 1))}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{formatter.format(Number(p.basic_salary ?? 0))} ج.م</td>
                    <td className="px-4 py-3 font-black text-emerald-600">
                      {(p.total_commissions ?? 0) > 0 ? `${formatter.format(Number(p.total_commissions))} ج.م` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-red-500">
                      {(p.deductions ?? 0) > 0 ? `(${formatter.format(Number(p.deductions))}) ج.م` : '—'}
                    </td>
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{formatter.format(Number(p.net_salary ?? 0))} ج.م</td>
                    <td className="px-4 py-3 text-xs font-bold text-[var(--fi-muted)]">
                      <span className="text-emerald-600">{p.present_days ?? 0}</span>
                      <span className="mx-1">/</span>
                      <span className="text-red-500">{p.absent_days ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-black ${p.status === 'approved' || p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {p.status === 'paid' ? 'مدفوع' : p.status === 'approved' ? 'مُقرَّر' : 'مسودة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Onboarding + Documents */}
      {(onboardingTasks.length > 0 || myDocs.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {onboardingTasks.length > 0 && (
            <section className="ds-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">ONBOARDING</p>
                  <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">
                    مهام الاستقبال
                    {onboardingPct !== null && (
                      <span className="mr-2 text-sm font-bold text-[var(--fi-muted)]">{onboardingPct}%</span>
                    )}
                  </h2>
                </div>
                <ClipboardList className="size-5 text-[var(--fi-muted)]" />
              </div>
              <div className="mb-4 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                <div
                  className="h-2 rounded-full bg-[var(--fi-emerald)] transition-all duration-500"
                  style={{ width: `${onboardingPct ?? 0}%` }}
                />
              </div>
              <div className="space-y-2">
                {onboardingTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <CheckCircle2 className={`size-4 shrink-0 ${t.completed_at ? 'text-emerald-500' : 'text-[var(--fi-line)]'}`} />
                    <span className={`text-sm font-bold ${t.completed_at ? 'text-[var(--fi-muted)] line-through' : 'text-[var(--fi-ink)]'}`}>
                      {t.task_title}
                    </span>
                    {t.due_date && !t.completed_at && (
                      <span className={`mr-auto text-xs font-bold ${new Date(t.due_date) < new Date() ? 'text-red-500' : 'text-[var(--fi-muted)]'}`}>
                        {dateFormatter.format(new Date(t.due_date))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {myDocs.length > 0 && (
            <section className="ds-card overflow-hidden">
              <div className="border-b border-[var(--fi-line)] p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">MY DOCUMENTS</p>
                <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">وثائقي</h2>
              </div>
              <div className="divide-y divide-[var(--fi-line)]">
                {myDocs.map((d) => {
                  const todayStr = new Date().toISOString().slice(0, 10)
                  const isExpired = d.expiry_date && d.expiry_date < todayStr
                  return (
                    <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="size-4 shrink-0 text-[var(--fi-muted)]" />
                        <div>
                          <p className="font-black text-[var(--fi-ink)]">{d.title}</p>
                          {d.expiry_date && (
                            <p className={`mt-0.5 text-xs font-bold ${isExpired ? 'text-red-500' : 'text-[var(--fi-muted)]'}`}>
                              {isExpired ? 'منتهية — ' : 'تنتهي: '}
                              {dateFormatter.format(new Date(d.expiry_date))}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {d.verified
                          ? <ShieldCheck className="size-4 text-emerald-500" />
                          : <span className="text-xs font-bold text-amber-500">بانتظار التحقق</span>
                        }
                        {d.file_path && (
                          <a href={`/api/erp/documents/${encodeURIComponent(d.file_path)}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-black text-[var(--fi-emerald)] hover:underline">
                            عرض
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Performance reviews */}
      {myReviews.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">MY PERFORMANCE</p>
            <h2 className="mt-1 text-xl font-black text-[var(--fi-ink)]">تقييمات الأداء</h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {myReviews.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-black text-[var(--fi-ink)]">{r.period_label}</p>
                  <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">
                    {r.review_cycle === 'quarterly' ? 'ربع سنوي' : r.review_cycle === 'semi_annual' ? 'نصف سنوي' : 'سنوي'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.final_score != null && (
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`size-4 ${star <= Math.round(r.final_score!) ? 'fill-amber-400 text-amber-400' : 'text-[var(--fi-line)]'}`} />
                      ))}
                      <span className="text-sm font-black text-[var(--fi-ink)]">{Number(r.final_score).toFixed(1)}</span>
                    </div>
                  )}
                  {r.rating_label && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${r.rating_label === 'ممتاز' ? 'bg-emerald-50 text-emerald-700' : r.rating_label === 'جيد جداً' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {r.rating_label}
                    </span>
                  )}
                  {r.promotion_flag && (
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700">ترقية ✓</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black ${r.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {r.status === 'completed' ? 'مكتمل' : 'جاري'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Culture pulse */}
      <PulseForm />
    </main>
  )
}

function labelStatus(status: string | null | undefined) {
  const map: Record<string, { label: string; cls: string }> = {
    present: { label: 'حاضر', cls: 'bg-emerald-50 text-emerald-700' },
    blocked: { label: 'خارج النطاق', cls: 'bg-red-50 text-red-700' },
    absent:  { label: 'غائب', cls: 'bg-red-50 text-red-700' },
    late:    { label: 'متأخر', cls: 'bg-amber-50 text-amber-700' },
    leave:   { label: 'إجازة', cls: 'bg-blue-50 text-blue-700' },
    remote:  { label: 'عن بعد', cls: 'bg-violet-50 text-violet-700' },
  }
  const entry = map[status ?? ''] ?? { label: 'غير محدد', cls: 'bg-slate-100 text-slate-600' }
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${entry.cls}`}>{entry.label}</span>
}
