import { redirect } from 'next/navigation'
import { BarChart3, TrendingUp, Users, WalletCards, CalendarDays, Target } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']

const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function HRAnalyticsPage() {
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Build 6-month window
  const months: { month: number; year: number; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1)
    months.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: d.toLocaleDateString('ar-EG', { month: 'short' }),
    })
  }

  // Parallel data fetching
  let empQuery = supabase
    .from('employees')
    .select('id, status, hire_date, department_id, basic_salary, base_salary, commission_rate, profiles!employees_id_fkey(role)')
  if (companyId) empQuery = empQuery.eq('company_id', companyId)

  let payrollQuery = supabase
    .from('payroll')
    .select('employee_id, month, year, net_salary, total_commissions, deductions, basic_salary, present_days, absent_days')
    .gte('year', currentYear - 1)
  if (companyId) payrollQuery = payrollQuery.eq('company_id', companyId)

  let commQuery = supabase
    .from('commission_deals')
    .select('employee_id, commission_amount, triggered_commission, status, created_at')
    .eq('status', 'approved')
  if (companyId) commQuery = commQuery.eq('company_id', companyId)

  let leaveQuery = supabase
    .from('leave_requests')
    .select('employee_id, days_count, status, start_date, leave_types!leave_requests_leave_type_id_fkey(name_ar)')
    .eq('status', 'approved')
  if (companyId) leaveQuery = leaveQuery.eq('company_id', companyId)

  let deptQuery = supabase
    .from('departments')
    .select('id, name_ar, name')

  const [empResult, payrollResult, commResult, leaveResult, deptResult] = await Promise.all([
    empQuery, payrollQuery, commQuery, leaveQuery, deptQuery,
  ])

  type EmpRow = {
    id: string; status: string | null; hire_date: string | null
    department_id: string | null; basic_salary: number | null; base_salary: number | null
    commission_rate: number | null
    profiles: { role: string | null } | { role: string | null }[] | null
  }
  type PayrollRow = {
    employee_id: string; month: number; year: number
    net_salary: number; total_commissions: number; deductions: number
    basic_salary: number; present_days: number; absent_days: number
  }
  type CommRow = { employee_id: string; commission_amount: number; triggered_commission: number; created_at: string }
  type LeaveRow = { employee_id: string; days_count: number; status: string; start_date: string; leave_types: { name_ar: string | null } | null }

  const employees = ((empResult.data ?? []) as unknown as EmpRow[]).map((e) => ({
    ...e,
    profiles: Array.isArray(e.profiles) ? e.profiles[0] : e.profiles,
  }))
  const payroll = (payrollResult.data ?? []) as unknown as PayrollRow[]
  const commissions = (commResult.data ?? []) as unknown as CommRow[]
  const leaves = ((leaveResult.data ?? []) as unknown as LeaveRow[]).map((l) => ({
    ...l,
    leave_types: Array.isArray(l.leave_types) ? l.leave_types[0] : l.leave_types,
  }))
  const departments = (deptResult.data ?? []) as { id: string; name_ar: string | null; name: string }[]
  const deptMap = new Map(departments.map((d) => [d.id, d.name_ar ?? d.name]))

  // KPIs
  const activeCount = employees.filter((e) => (e.status ?? 'active') === 'active').length
  const thisMonthPayroll = payroll.filter((p) => p.month === currentMonth && p.year === currentYear)
  const totalNetThisMonth = thisMonthPayroll.reduce((s, p) => s + Number(p.net_salary ?? 0), 0)
  const totalCommissionsTotal = commissions.reduce((s, c) => s + Number(c.triggered_commission ?? 0), 0)
  const avgSalary = activeCount > 0
    ? employees.reduce((s, e) => s + Number(e.basic_salary ?? e.base_salary ?? 0), 0) / activeCount
    : 0
  const totalLeaveDays = leaves.reduce((s, l) => s + Number(l.days_count ?? 0), 0)

  // 6-month payroll trend
  const payrollTrend = months.map(({ month, year, label }) => {
    const rows = payroll.filter((p) => p.month === month && p.year === year)
    return {
      label,
      net: rows.reduce((s, p) => s + Number(p.net_salary ?? 0), 0),
      comm: rows.reduce((s, p) => s + Number(p.total_commissions ?? 0), 0),
      ded: rows.reduce((s, p) => s + Number(p.deductions ?? 0), 0),
      count: rows.length,
    }
  })
  const maxTrend = Math.max(...payrollTrend.map((t) => t.net), 1)

  // Attendance rate per month
  const attendanceTrend = months.map(({ month, year, label }) => {
    const rows = payroll.filter((p) => p.month === month && p.year === year)
    const totalPresent = rows.reduce((s, p) => s + Number(p.present_days ?? 0), 0)
    const totalAbsent  = rows.reduce((s, p) => s + Number(p.absent_days ?? 0), 0)
    const total = totalPresent + totalAbsent
    return { label, rate: total > 0 ? Math.round((totalPresent / total) * 100) : 0 }
  })

  // Department cost breakdown
  const deptCost = Object.values(
    employees.reduce<Record<string, { name: string; salary: number; count: number }>>((acc, e) => {
      const key = e.department_id ?? 'other'
      if (!acc[key]) acc[key] = { name: deptMap.get(key) ?? 'غير محدد', salary: 0, count: 0 }
      acc[key].salary += Number(e.basic_salary ?? e.base_salary ?? 0)
      acc[key].count++
      return acc
    }, {}),
  ).sort((a, b) => b.salary - a.salary)
  const maxDeptCost = Math.max(...deptCost.map((d) => d.salary), 1)

  // Top commission earners
  const earnerMap = commissions.reduce<Record<string, number>>((acc, c) => {
    acc[c.employee_id] = (acc[c.employee_id] ?? 0) + Number(c.triggered_commission ?? 0)
    return acc
  }, {})
  const topEarners = Object.entries(earnerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([empId, total]) => {
      const emp = employees.find((e) => e.id === empId)
      return { empId, total }
    })

  // Headcount by role
  const roleCount = employees.reduce<Record<string, number>>((acc, e) => {
    const role = e.profiles?.role ?? 'unknown'
    acc[role] = (acc[role] ?? 0) + 1
    return acc
  }, {})

  // Turnover: employees hired this year vs active
  const thisYearHires = employees.filter((e) => {
    if (!e.hire_date) return false
    return new Date(e.hire_date).getFullYear() === currentYear
  }).length

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">HR ANALYTICS & INTELLIGENCE</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">تحليلات الموارد البشرية</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
          رؤى شاملة عن تكلفة القوى البشرية، الحضور، العمولات، والنمو.
        </p>
      </section>

      <BentoGrid>
        <BentoKpiCard title="الموظفون النشطون" value={<AnimatedCount value={activeCount} />} hint={`${thisYearHires} توظيف هذا العام`} icon={<Users className="size-5" />} />
        <BentoKpiCard title="رواتب هذا الشهر" value={<><AnimatedCount value={totalNetThisMonth} /> <span className="text-base">ج.م</span></>} hint={`${currentMonth}/${currentYear}`} icon={<WalletCards className="size-5" />} />
        <BentoKpiCard title="متوسط الراتب" value={<><AnimatedCount value={Math.round(avgSalary)} /> <span className="text-base">ج.م</span></>} hint="أساسي / موظف" icon={<Target className="size-5" />} />
        <BentoKpiCard title="إجمالي العمولات" value={<><AnimatedCount value={Math.round(totalCommissionsTotal)} /> <span className="text-base">ج.م</span></>} hint="مُقرَّرة الكل" icon={<TrendingUp className="size-5" />} />
        <BentoKpiCard title="أيام الإجازات" value={<AnimatedCount value={totalLeaveDays} />} hint="مُقرَّرة هذا العام" icon={<CalendarDays className="size-5" />} />
        <BentoKpiCard title="أقسام" value={<AnimatedCount value={deptCost.length} />} hint="بها موظفون" icon={<BarChart3 className="size-5" />} />
      </BentoGrid>

      {/* 6-month payroll trend */}
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">PAYROLL TREND</p>
        <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">اتجاه الرواتب — آخر 6 أشهر</h2>
        <div className="mt-5 flex items-end gap-3">
          {payrollTrend.map((t) => (
            <div key={t.label} className="flex flex-1 flex-col items-center gap-1.5">
              <p className="text-xs font-black text-[var(--fi-ink)]">{t.net > 0 ? fmt(t.net) : ''}</p>
              <div className="relative w-full">
                <div
                  className="w-full rounded-t-md bg-emerald-500 transition-all"
                  style={{ height: `${Math.max(4, (t.net / maxTrend) * 120)}px` }}
                />
                {t.comm > 0 && (
                  <div
                    className="absolute bottom-0 w-full rounded-t-md bg-amber-400 opacity-60"
                    style={{ height: `${Math.max(2, (t.comm / maxTrend) * 120)}px` }}
                    title={`عمولات: ${fmt(t.comm)} ج.م`}
                  />
                )}
              </div>
              <p className="text-xs font-bold text-[var(--fi-muted)]">{t.label}</p>
              <p className="text-xs text-[var(--fi-muted)]">{t.count} موظف</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs font-bold text-[var(--fi-muted)]">
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-emerald-500" /> صافي الرواتب</span>
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm bg-amber-400 opacity-70" /> العمولات</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance rate trend */}
        <section className="ds-card p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">ATTENDANCE RATE</p>
          <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">معدل الحضور الشهري</h2>
          <div className="mt-5 space-y-3">
            {attendanceTrend.map((t) => (
              <div key={t.label} className="flex items-center gap-3">
                <span className="w-10 text-right text-xs font-bold text-[var(--fi-muted)]">{t.label}</span>
                <div className="relative flex-1 overflow-hidden rounded-full bg-[var(--fi-soft)] h-4">
                  <div
                    className={`h-full rounded-full transition-all ${t.rate >= 90 ? 'bg-emerald-500' : t.rate >= 75 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${t.rate}%` }}
                  />
                </div>
                <span className="w-10 text-xs font-black text-[var(--fi-ink)]">{t.rate}%</span>
              </div>
            ))}
            {attendanceTrend.every((t) => t.rate === 0) && (
              <p className="text-sm font-bold text-[var(--fi-muted)]">لا توجد بيانات حضور بعد.</p>
            )}
          </div>
        </section>

        {/* Department cost */}
        <section className="ds-card p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">DEPT COST</p>
          <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">تكلفة الرواتب حسب القسم</h2>
          <div className="mt-5 space-y-3">
            {deptCost.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="min-w-[90px] text-right text-xs font-bold text-[var(--fi-muted)] truncate">{d.name}</span>
                <div className="relative flex-1 overflow-hidden rounded-full bg-[var(--fi-soft)] h-4">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(d.salary / maxDeptCost) * 100}%` }}
                  />
                </div>
                <span className="w-20 text-right text-xs font-black text-[var(--fi-ink)]">{fmt(d.salary)} ج.م</span>
              </div>
            ))}
            {!deptCost.length && (
              <p className="text-sm font-bold text-[var(--fi-muted)]">لا توجد بيانات أقسام بعد.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top commission earners */}
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">أعلى محققي العمولات</h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {topEarners.map(({ empId, total }, i) => {
              const emp = employees.find((e) => e.id === empId)
              return (
                <div key={empId} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-ink)]">
                      {i + 1}
                    </span>
                    <span className="text-sm font-black text-[var(--fi-ink)]">
                      {emp?.profiles?.role ?? empId.slice(0, 8)}
                    </span>
                  </div>
                  <span className="text-sm font-black text-emerald-600">{fmt(total)} ج.م</span>
                </div>
              )
            })}
            {!topEarners.length && (
              <p className="px-5 py-8 text-center text-sm font-bold text-[var(--fi-muted)]">لا توجد عمولات مُقرَّرة بعد.</p>
            )}
          </div>
        </section>

        {/* Headcount by role */}
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">توزيع الموظفين حسب الدور</h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {Object.entries(roleCount)
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => (
                <div key={role} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-bold text-[var(--fi-muted)]">{role}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 overflow-hidden rounded-full bg-[var(--fi-soft)] h-2">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${(count / activeCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-sm font-black text-[var(--fi-ink)]">{count}</span>
                  </div>
                </div>
              ))}
            {!Object.keys(roleCount).length && (
              <p className="px-5 py-8 text-center text-sm font-bold text-[var(--fi-muted)]">لا توجد بيانات.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
