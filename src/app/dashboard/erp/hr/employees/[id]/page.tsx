import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  Brain,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardList,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  User,
  WalletCards,
} from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = [
  'super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager',
]

const formatter = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('ar-EG', { month: 'short', year: 'numeric' })

const roleLabels: Record<string, string> = {
  super_admin: 'مدير النظام', platform_admin: 'مدير المنصة',
  company_owner: 'مالك الشركة', company_admin: 'مدير الشركة',
  branch_manager: 'مدير فرع', senior_agent: 'وكيل أول', agent: 'وكيل مبيعات',
  finance_officer: 'مسؤول مالي', finance_manager: 'مدير مالي',
  hr_manager: 'مدير موارد بشرية', hr_staff: 'موظف موارد بشرية',
  hr_officer: 'مسؤول موارد بشرية', customer_support: 'خدمة عملاء',
  marketing_manager: 'مدير تسويق', inventory_rep: 'إدخال بيانات',
  data_manager: 'مدير بيانات', viewer: 'مشاهد',
}

const dealStageBadge: Record<string, string> = {
  reservation: 'bg-blue-50 text-blue-700',
  contract: 'bg-violet-50 text-violet-700',
  handover: 'bg-amber-50 text-amber-700',
  collection: 'bg-emerald-50 text-emerald-700',
}
const dealStageLabel: Record<string, string> = {
  reservation: 'حجز', contract: 'عقد', handover: 'تسليم', collection: 'تحصيل',
}

const riskBadge: Record<string, string> = {
  high: 'bg-red-50 text-red-700', medium: 'bg-amber-50 text-amber-700', low: 'bg-emerald-50 text-emerald-700',
}
const riskLabel: Record<string, string> = { high: '🔴 عالٍ', medium: '🟡 متوسط', low: '🟢 منخفض' }

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { data: empRaw } = await supabase
    .from('employees')
    .select(`
      id, user_id, employee_number, job_title, employment_type,
      hire_date, termination_date, base_salary, basic_salary,
      commission_rate, status, is_env_locked, allowed_ip,
      bank_name, bank_account_number, social_insurance_no,
      annual_leave_balance, department_id, notes,
      profiles!employees_id_fkey(full_name, email, phone, role)
    `)
    .eq('id', id)
    .maybeSingle()

  if (!empRaw) notFound()
  const emp = empRaw as any
  const empProfile = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles

  // Guard: non-super-admin can only see employees of their own company
  if (profile.role !== 'super_admin' && companyId && emp.company_id && emp.company_id !== companyId) {
    redirect('/dashboard/erp/hr')
  }

  // Parallel data fetching
  const [
    attendanceResult,
    payrollResult,
    dealsResult,
    enrollmentsResult,
    burnoutResult,
    skillsResult,
    departmentResult,
    leavesResult,
    reviewsResult,
    docsResult,
    onboardingResult,
  ] = await Promise.all([
    // Last 12 months attendance summary
    supabase
      .from('attendance_logs')
      .select('log_date, status')
      .eq('employee_id', id)
      .gte('log_date', `${year - 1}-${String(month).padStart(2, '0')}-01`)
      .order('log_date', { ascending: false })
      .limit(500),
    // Last 12 months payroll
    supabase
      .from('payroll')
      .select('month, year, basic_salary, total_commissions, deductions, gross_salary, net_salary, status, present_days, absent_days, late_count')
      .eq('employee_id', id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(12),
    // Commission deals
    supabase
      .from('commission_deals')
      .select('deal_ref, unit_ref, client_name, sale_value, commission_amount, triggered_commission, deal_stage, status, created_at')
      .eq('employee_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    // Course enrollments
    supabase
      .from('course_enrollments')
      .select('status, score, enrolled_at, completed_at, learning_courses!course_enrollments_course_id_fkey(title, category, duration_hours)')
      .eq('employee_id', id)
      .order('enrolled_at', { ascending: false }),
    // Burnout history
    supabase
      .from('burnout_indicators')
      .select('period_month, period_year, burnout_score, risk_level, workload_score, overtime_hours, absence_days')
      .eq('employee_id', id)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(6),
    // Skill assessments
    supabase
      .from('skill_assessments')
      .select('skill_name, current_level, target_level, gap, category')
      .eq('employee_id', id)
      .order('gap', { ascending: false }),
    // Department
    emp.department_id
      ? supabase.from('departments').select('name_ar, name').eq('id', emp.department_id).maybeSingle()
      : Promise.resolve({ data: null }),
    // Leave requests
    supabase
      .from('leave_requests')
      .select('id, leave_type_id, start_date, end_date, days_count, status, reason, created_at, leave_types!leave_requests_leave_type_id_fkey(name_ar)')
      .eq('employee_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    // Performance reviews
    supabase
      .from('performance_reviews')
      .select('id, period_label, review_cycle, period_start, final_score, rating_label, promotion_flag, salary_increase_pct, status')
      .eq('employee_id', id)
      .order('period_start', { ascending: false })
      .limit(10),
    // Employee documents
    supabase
      .from('employee_documents')
      .select('id, doc_type, title, file_path, file_name, expiry_date, verified, created_at')
      .eq('employee_id', id)
      .order('created_at', { ascending: false }),
    // Onboarding tasks
    supabase
      .from('onboarding_tasks')
      .select('id, task_title, completed_at, due_date, order_index')
      .eq('employee_id', id)
      .order('order_index', { ascending: true }),
  ])

  const attendanceLogs = (attendanceResult.data ?? []) as Array<{ log_date: string; status: string }>
  const payrollHistory = (payrollResult.data ?? []) as Array<{
    month: number; year: number; basic_salary: number; total_commissions: number
    deductions: number; gross_salary: number; net_salary: number; status: string
    present_days: number; absent_days: number; late_count: number
  }>
  const deals = (dealsResult.data ?? []) as Array<{
    deal_ref: string; unit_ref: string | null; client_name: string | null
    sale_value: number; commission_amount: number; triggered_commission: number
    deal_stage: string; status: string; created_at: string
  }>
  const enrollments = ((enrollmentsResult.data ?? []) as any[]).map((e) => ({
    ...e,
    learning_courses: Array.isArray(e.learning_courses) ? e.learning_courses[0] : e.learning_courses,
  }))
  const burnoutHistory = (burnoutResult.data ?? []) as Array<{
    period_month: number; period_year: number; burnout_score: number
    risk_level: string; workload_score: number; overtime_hours: number; absence_days: number
  }>
  const skills = (skillsResult.data ?? []) as Array<{
    skill_name: string; current_level: number; target_level: number; gap: number; category: string
  }>
  const department = (departmentResult as any).data as { name_ar: string | null; name: string } | null

  const leaveRequests = ((leavesResult.data ?? []) as any[]).map((l) => ({
    id: l.id as string,
    leaveType: (Array.isArray(l.leave_types) ? l.leave_types[0] : l.leave_types)?.name_ar ?? 'إجازة',
    startDate: l.start_date as string,
    endDate: l.end_date as string,
    workingDays: l.days_count as number,
    status: l.status as string,
    reason: l.reason as string | null,
    createdAt: l.created_at as string,
  }))

  const performanceReviews = (reviewsResult.data ?? []) as Array<{
    id: string; period_label: string; review_cycle: string
    period_start: string | null; final_score: number | null
    rating_label: string | null; promotion_flag: boolean
    salary_increase_pct: number | null; status: string
  }>

  const documents = (docsResult.data ?? []) as Array<{
    id: string; doc_type: string; title: string; file_path: string | null
    file_name: string | null; expiry_date: string | null; verified: boolean; created_at: string
  }>

  const onboardingTasks = (onboardingResult.data ?? []) as Array<{
    id: string; task_title: string; completed_at: string | null; due_date: string | null; order_index: number
  }>
  const onboardingPct = onboardingTasks.length
    ? Math.round((onboardingTasks.filter((t) => t.completed_at !== null).length / onboardingTasks.length) * 100)
    : null

  // Computed stats
  const presentCount = attendanceLogs.filter((l) => l.status === 'present').length
  const absentCount = attendanceLogs.filter((l) => l.status === 'absent').length
  const totalCommissionsApproved = deals
    .filter((d) => d.status === 'approved')
    .reduce((s, d) => s + Number(d.triggered_commission), 0)
  const totalSalesValue = deals.reduce((s, d) => s + Number(d.sale_value), 0)
  const completedCourses = enrollments.filter((e) => e.status === 'completed').length
  const currentPayroll = payrollHistory[0]
  const latestBurnout = burnoutHistory[0]
  const avgBurnout = burnoutHistory.length
    ? burnoutHistory.reduce((s, b) => s + b.burnout_score, 0) / burnoutHistory.length
    : null

  const tenureMs = emp.hire_date ? Date.now() - new Date(emp.hire_date).getTime() : 0
  const tenureMonths = Math.floor(tenureMs / (1000 * 60 * 60 * 24 * 30.5))
  const tenureLabel = tenureMonths >= 12
    ? `${Math.floor(tenureMonths / 12)} سنة ${tenureMonths % 12 > 0 ? `و ${tenureMonths % 12} شهر` : ''}`
    : `${tenureMonths} شهر`

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      {/* Back link */}
      <Link
        href="/dashboard/erp/hr"
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--fi-muted)] transition hover:text-[var(--fi-ink)]"
      >
        <ArrowRight className="size-4" />
        العودة إلى سجل الموظفين
      </Link>

      {/* Hero card */}
      <section className="ds-card p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--fi-soft)] text-2xl font-black text-[var(--fi-emerald)]">
              {(empProfile?.full_name ?? 'م').charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--fi-ink)]">{empProfile?.full_name ?? 'غير محدد'}</h1>
              <p className="mt-1 font-bold text-[var(--fi-muted)]">{emp.job_title ?? 'غير محدد'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--fi-soft)] px-3 py-1 text-xs font-black text-[var(--fi-emerald)]">
                  {emp.employee_number}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {emp.status === 'active' ? 'نشط' : emp.status}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${emp.is_env_locked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {emp.is_env_locked ? '🔒 بيئة مربوطة' : '⚠️ غير مربوطة'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:text-left">
            {empProfile?.email && (
              <a href={`mailto:${empProfile.email}`} className="flex items-center gap-2 text-sm font-bold text-[var(--fi-muted)] hover:text-[var(--fi-ink)]">
                <Mail className="size-4 text-[var(--fi-emerald)]" />
                {empProfile.email}
              </a>
            )}
            {empProfile?.phone && (
              <a href={`tel:${empProfile.phone}`} className="flex items-center gap-2 text-sm font-bold text-[var(--fi-muted)] hover:text-[var(--fi-ink)]">
                <Phone className="size-4 text-[var(--fi-emerald)]" />
                {empProfile.phone}
              </a>
            )}
            {department && (
              <span className="flex items-center gap-2 text-sm font-bold text-[var(--fi-muted)]">
                <Building2 className="size-4 text-[var(--fi-emerald)]" />
                {department.name_ar ?? department.name}
              </span>
            )}
            <span className="flex items-center gap-2 text-sm font-bold text-[var(--fi-muted)]">
              <User className="size-4 text-[var(--fi-emerald)]" />
              {roleLabels[empProfile?.role ?? ''] ?? empProfile?.role ?? '—'}
            </span>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<CalendarDays className="size-5 text-emerald-600" />} color="emerald" label="مدة الخدمة" value={emp.hire_date ? tenureLabel : '—'} hint={emp.hire_date ? dateFormatter.format(new Date(emp.hire_date)) : ''} />
        <StatCard icon={<BadgeDollarSign className="size-5 text-amber-600" />} color="amber" label="عمولات مُقرَّرة" value={`${formatter.format(totalCommissionsApproved)} ج.م`} hint={`${deals.filter((d) => d.status === 'approved').length} صفقة`} />
        <StatCard icon={<WalletCards className="size-5 text-blue-600" />} color="blue" label="صافي الشهر" value={`${formatter.format(currentPayroll?.net_salary ?? Number(emp.basic_salary ?? emp.base_salary ?? 0))} ج.م`} hint={currentPayroll ? (currentPayroll.status === 'approved' ? 'مُقرَّر' : 'مسودة') : 'لم تُصدر'} />
        <StatCard icon={<Brain className="size-5 text-red-500" />} color="red" label="مؤشر الإجهاد" value={latestBurnout ? `${latestBurnout.burnout_score}/10` : '—'} hint={latestBurnout ? riskLabel[latestBurnout.risk_level] : 'لم يُقيَّم'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Contract info */}
        <section className="ds-card p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">CONTRACT INFO</p>
          <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">بيانات العقد</h2>
          <dl className="mt-4 grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <InfoItem label="تاريخ التعيين" value={emp.hire_date ? dateFormatter.format(new Date(emp.hire_date)) : '—'} />
            <InfoItem label="نوع التعاقد" value={emp.employment_type === 'full_time' ? 'دوام كامل' : emp.employment_type ?? '—'} />
            <InfoItem label="الراتب الأساسي" value={`${formatter.format(Number(emp.basic_salary ?? emp.base_salary ?? 0))} ج.م`} />
            <InfoItem label="نسبة العمولة" value={emp.commission_rate ? `${emp.commission_rate}%` : 'متدرجة'} />
            <InfoItem label="رصيد الإجازات" value={emp.annual_leave_balance != null ? `${emp.annual_leave_balance} يوم` : '—'} />
            <InfoItem label="التأمين الاجتماعي" value={emp.social_insurance_no ?? '—'} />
            {emp.bank_name && <InfoItem label="البنك" value={emp.bank_name} />}
            {emp.bank_account_number && <InfoItem label="رقم الحساب" value={`****${emp.bank_account_number.slice(-4)}`} />}
          </dl>
          {emp.notes && (
            <div className="mt-4 rounded-lg bg-[var(--fi-soft)] p-3 text-sm font-bold text-[var(--fi-muted)]">
              {emp.notes}
            </div>
          )}
        </section>

        {/* Attendance heatmap (monthly summary) */}
        <section className="ds-card p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">ATTENDANCE SUMMARY</p>
          <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">إحصاء الحضور — 12 شهر</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-black text-emerald-700">{presentCount}</p>
              <p className="mt-1 text-xs font-bold text-emerald-600">يوم حضور</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <p className="text-2xl font-black text-red-700">{absentCount}</p>
              <p className="mt-1 text-xs font-bold text-red-600">يوم غياب</p>
            </div>
            <div className="rounded-xl bg-[var(--fi-soft)] p-3 text-center">
              <p className="text-2xl font-black text-[var(--fi-ink)]">
                {presentCount + absentCount > 0
                  ? `${Math.round((presentCount / (presentCount + absentCount)) * 100)}%`
                  : '—'}
              </p>
              <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">نسبة الحضور</p>
            </div>
          </div>
          {/* Monthly attendance bars */}
          {payrollHistory.length > 0 && (
            <div className="mt-4 space-y-2">
              {[...payrollHistory].reverse().map((p) => {
                const total = (p.present_days ?? 0) + (p.absent_days ?? 0)
                const pct = total > 0 ? (p.present_days / total) * 100 : 0
                return (
                  <div key={`${p.month}-${p.year}`} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs font-bold text-[var(--fi-muted)]">
                      {monthFormatter.format(new Date(p.year, p.month - 1))}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                      <div
                        className={`h-2 rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-black text-[var(--fi-ink)]">{Math.round(pct)}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Payroll history */}
      {payrollHistory.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">PAYROLL HISTORY</p>
            <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">تاريخ الرواتب</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">الشهر</th>
                  <th className="px-4 py-3 text-right">الراتب</th>
                  <th className="px-4 py-3 text-right">عمولات</th>
                  <th className="px-4 py-3 text-right">استقطاعات</th>
                  <th className="px-4 py-3 text-right">الصافي</th>
                  <th className="px-4 py-3 text-right">حضور / غياب</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {payrollHistory.map((p) => (
                  <tr key={`${p.month}-${p.year}`} className="transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">
                      {monthFormatter.format(new Date(p.year, p.month - 1))}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{formatter.format(p.basic_salary ?? 0)} ج.م</td>
                    <td className="px-4 py-3 font-black text-emerald-600">
                      {p.total_commissions > 0 ? `${formatter.format(p.total_commissions)} ج.م` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-red-500">
                      {p.deductions > 0 ? `(${formatter.format(p.deductions)}) ج.م` : '—'}
                    </td>
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{formatter.format(p.net_salary ?? 0)} ج.م</td>
                    <td className="px-4 py-3 text-xs font-bold text-[var(--fi-muted)]">
                      <span className="text-emerald-600">{p.present_days ?? 0}</span>
                      <span className="mx-1">/</span>
                      <span className="text-red-500">{p.absent_days ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-black ${p.status === 'approved' || p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {p.status === 'approved' ? 'مُقرَّر' : p.status === 'paid' ? 'مدفوع' : 'مسودة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Commission deals */}
        {deals.length > 0 && (
          <section className="ds-card overflow-hidden">
            <div className="border-b border-[var(--fi-line)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">SALES PERFORMANCE</p>
              <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">الصفقات والعمولات</h2>
              <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">
                إجمالي المبيعات: {formatter.format(totalSalesValue)} ج.م
              </p>
            </div>
            <div className="divide-y divide-[var(--fi-line)]">
              {deals.slice(0, 8).map((deal, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-4 transition hover:bg-[var(--fi-soft)]/60">
                  <div>
                    <p className="font-black text-[var(--fi-ink)]">{deal.deal_ref}</p>
                    <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">
                      {deal.client_name ?? '—'} {deal.unit_ref ? `· ${deal.unit_ref}` : ''}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-emerald-600">{formatter.format(deal.triggered_commission)} ج.م</p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-black ${dealStageBadge[deal.deal_stage] ?? 'bg-slate-100 text-slate-600'}`}>
                        {dealStageLabel[deal.deal_stage] ?? deal.deal_stage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-6">
          {/* Skills */}
          {skills.length > 0 && (
            <section className="ds-card p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">SKILL MAP</p>
              <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">خريطة المهارات</h2>
              <div className="mt-4 space-y-3">
                {skills.map((s) => (
                  <div key={s.skill_name}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--fi-ink)]">{s.skill_name}</span>
                      <span className="text-xs font-black text-[var(--fi-muted)]">{s.current_level}/{s.target_level}</span>
                    </div>
                    <div className="overflow-hidden rounded-full bg-[var(--fi-soft)]">
                      <div
                        className={`h-2 rounded-full transition-all ${s.gap === 0 ? 'bg-emerald-500' : s.gap <= 2 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${(s.current_level / (s.target_level || 10)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Burnout trend */}
          {burnoutHistory.length > 0 && (
            <section className="ds-card p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">BURNOUT TREND</p>
              <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">
                اتجاه الإجهاد
                {avgBurnout != null && (
                  <span className="mr-2 text-sm font-bold text-[var(--fi-muted)]">
                    متوسط: {avgBurnout.toFixed(1)}/10
                  </span>
                )}
              </h2>
              <div className="mt-4 space-y-2">
                {[...burnoutHistory].reverse().map((b) => (
                  <div key={`${b.period_month}-${b.period_year}`} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs font-bold text-[var(--fi-muted)]">
                      {monthFormatter.format(new Date(b.period_year, b.period_month - 1))}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                      <div
                        className={`h-2 rounded-full transition-all ${b.burnout_score >= 7 ? 'bg-red-500' : b.burnout_score >= 4 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${(b.burnout_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className={`w-16 text-right text-xs font-black ${riskBadge[b.risk_level] ? '' : ''}`}>
                      <span className={`rounded-full px-2 py-0.5 ${riskBadge[b.risk_level] ?? 'bg-slate-100 text-slate-600'}`}>
                        {riskLabel[b.risk_level]}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Learning path */}
          {enrollments.length > 0 && (
            <section className="ds-card p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">LEARNING PATH</p>
              <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">
                المسار التعليمي
                <span className="mr-2 text-sm font-bold text-[var(--fi-muted)]">
                  {completedCourses}/{enrollments.length} مكتمل
                </span>
              </h2>
              <div className="mt-3 space-y-2">
                {enrollments.map((e, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--fi-soft)] p-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 shrink-0 text-blue-500" />
                      <span className="text-sm font-bold text-[var(--fi-ink)]">{e.learning_courses?.title ?? 'مقرر'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {e.score != null && <span className="text-xs font-black text-[var(--fi-muted)]">{e.score}/100</span>}
                      <CheckCircle2 className={`size-4 ${e.status === 'completed' ? 'text-emerald-500' : 'text-[var(--fi-line)]'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Performance reviews */}
      {performanceReviews.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">PERFORMANCE REVIEWS</p>
            <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">تقييمات الأداء</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">الفترة</th>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">الدرجة</th>
                  <th className="px-4 py-3 text-right">التقييم</th>
                  <th className="px-4 py-3 text-right">ترقية</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {performanceReviews.map((r) => (
                  <tr key={r.id} className="transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{r.period_label}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">
                      {r.review_cycle === 'quarterly' ? 'ربع سنوي' : r.review_cycle === 'semi_annual' ? 'نصف سنوي' : 'سنوي'}
                    </td>
                    <td className="px-4 py-3">
                      {r.final_score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                            <div
                              className={`h-2 rounded-full ${r.final_score >= 4 ? 'bg-emerald-500' : r.final_score >= 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${(r.final_score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="font-black text-[var(--fi-ink)]">{r.final_score.toFixed(2)}/5</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.rating_label && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-black ${r.rating_label === 'ممتاز' ? 'bg-emerald-50 text-emerald-700' : r.rating_label === 'جيد جداً' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {r.rating_label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.promotion_flag ? (
                        <span className="flex items-center gap-1 text-xs font-black text-emerald-600">
                          <Star className="size-3 fill-emerald-500 text-emerald-500" /> ترقية
                        </span>
                      ) : <span className="text-xs text-[var(--fi-muted)]">—</span>}
                      {r.salary_increase_pct != null && r.salary_increase_pct > 0 && (
                        <p className="mt-0.5 text-xs font-bold text-emerald-600">+{r.salary_increase_pct}%</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-black ${r.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {r.status === 'completed' ? 'مكتمل' : r.status === 'in_progress' ? 'جاري' : 'معلّق'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Leave requests */}
        {leaveRequests.length > 0 && (
          <section className="ds-card overflow-hidden">
            <div className="border-b border-[var(--fi-line)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">LEAVE HISTORY</p>
              <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">سجل الإجازات</h2>
            </div>
            <div className="divide-y divide-[var(--fi-line)]">
              {leaveRequests.slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-black text-[var(--fi-ink)]">{l.leaveType}</p>
                    <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">
                      {dateFormatter.format(new Date(l.startDate))} — {dateFormatter.format(new Date(l.endDate))}
                      {' '}· {l.workingDays} يوم عمل
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                    l.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    l.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    l.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {l.status === 'approved' ? 'مقبولة' : l.status === 'rejected' ? 'مرفوضة' : l.status === 'cancelled' ? 'ملغاة' : 'قيد الانتظار'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Onboarding */}
        {onboardingTasks.length > 0 && (
          <section className="ds-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">ONBOARDING</p>
                <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">
                  الاستقبال
                  <span className="mr-2 text-sm font-bold text-[var(--fi-muted)]">{onboardingPct}%</span>
                </h2>
              </div>
              <ClipboardList className="size-5 text-[var(--fi-muted)]" />
            </div>
            <div className="mb-3 overflow-hidden rounded-full bg-[var(--fi-soft)]">
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
                    <span className={`mr-auto shrink-0 text-xs font-bold ${new Date(t.due_date) < new Date() ? 'text-red-500' : 'text-[var(--fi-muted)]'}`}>
                      {dateFormatter.format(new Date(t.due_date))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Documents */}
      {documents.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">DOCUMENT VAULT</p>
            <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">وثائق الموظف</h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {documents.map((d) => {
              const today = new Date().toISOString().slice(0, 10)
              const isExpired = d.expiry_date && d.expiry_date < today
              return (
                <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 shrink-0 text-[var(--fi-muted)]" />
                    <div>
                      <p className="font-black text-[var(--fi-ink)]">{d.title}</p>
                      <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">
                        {d.file_name ?? d.doc_type}
                        {d.expiry_date && (
                          <span className={`mr-2 ${isExpired ? 'text-red-500' : ''}`}>
                            · ينتهي: {dateFormatter.format(new Date(d.expiry_date))}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {d.verified ? (
                      <ShieldCheck className="size-4 text-emerald-500" />
                    ) : (
                      <Clock className="size-4 text-amber-500" />
                    )}
                    {d.file_path && (
                      <a
                        href={`/api/erp/documents/${encodeURIComponent(d.file_path)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-black text-[var(--fi-emerald)] hover:underline"
                      >
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

      {/* Environment info */}
      <section className="ds-card p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className={`size-5 ${emp.is_env_locked ? 'text-emerald-500' : 'text-amber-500'}`} />
          <div>
            <p className="font-black text-[var(--fi-ink)]">بيئة العمل</p>
            {emp.is_env_locked ? (
              <p className="mt-0.5 text-sm font-bold text-[var(--fi-muted)]">
                IP: {emp.allowed_ip ?? '—'}
                {emp.allowed_wifi_ssid && ` · WiFi: ${emp.allowed_wifi_ssid}`}
              </p>
            ) : (
              <p className="mt-0.5 text-sm font-bold text-amber-600">لم يتم ربط بيئة العمل بعد.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

function StatCard({ icon, color, label, value, hint }: {
  icon: React.ReactNode; color: string; label: string; value: string; hint: string
}) {
  const bg: Record<string, string> = {
    emerald: 'bg-emerald-50', amber: 'bg-amber-50', blue: 'bg-blue-50', red: 'bg-red-50',
  }
  return (
    <div className="ds-card p-4">
      <div className={`mb-3 flex size-10 items-center justify-center rounded-xl ${bg[color] ?? 'bg-[var(--fi-soft)]'}`}>
        {icon}
      </div>
      <p className="text-lg font-black text-[var(--fi-ink)]">{value}</p>
      <p className="mt-0.5 text-sm font-bold text-[var(--fi-muted)]">{label}</p>
      {hint && <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">{hint}</p>}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-[var(--fi-muted)]">{label}</dt>
      <dd className="mt-0.5 font-black text-[var(--fi-ink)]">{value}</dd>
    </div>
  )
}
