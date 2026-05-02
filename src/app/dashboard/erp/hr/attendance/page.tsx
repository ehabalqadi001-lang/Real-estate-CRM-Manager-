import { getI18n } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import { CalendarDays, Clock, UserX, TrendingUp } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { AttendanceEntryForm, type EmployeeOption } from './AttendanceEntryForm'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

type AttendanceLog = {
  id: string
  employee_id: string
  log_date: string
  check_in: string | null
  check_out: string | null
  status: string
  notes: string | null
  profiles: { full_name: string | null; job_title?: string | null } | null
}

const statusBadge: Record<string, string> = {
  present: 'bg-emerald-50 text-emerald-700',
  absent: 'bg-red-50 text-red-700',
  late: 'bg-amber-50 text-amber-700',
  half_day: 'bg-blue-50 text-blue-700',
  blocked: 'bg-red-100 text-red-800',
}

function makeFormatTime(locale: string) {
  const fmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
  return (iso: string | null) => iso ? fmt.format(new Date(iso)) : '—'
}

function makeFormatDate(locale: string) {
  const fmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', weekday: 'short' })
  return (date: string) => fmt.format(new Date(date))
}

function calcDuration(checkIn: string | null, checkOut: string | null, hLabel: string, mLabel: string) {
  if (!checkIn || !checkOut) return null
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return `${hours}${hLabel} ${minutes}${mLabel}`
}

export default async function AttendancePage() {
  const { t, numLocale } = await getI18n()
  const formatTime = makeFormatTime(numLocale)
  const formatDate = makeFormatDate(numLocale)
  const hLabel = t('س', 'h')
  const mLabel = t('د', 'm')
  const statusLabel: Record<string, string> = {
    present:  t('حاضر', 'Present'),
    absent:   t('غائب', 'Absent'),
    late:     t('متأخر', 'Late'),
    half_day: t('نصف يوم', 'Half Day'),
    blocked:  t('خارج النطاق', 'Out of Range'),
  }
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const today = now.toISOString().slice(0, 10)

  // Last 30 days attendance logs with employee profiles
  let logsQuery = supabase
    .from('attendance_logs')
    .select(`
      id, employee_id, log_date, check_in, check_out, status, notes,
      profiles!attendance_logs_employee_id_fkey(full_name)
    `)
    .gte('log_date', monthStart)
    .order('log_date', { ascending: false })
    .order('check_in', { ascending: true })
    .limit(500)

  if (companyId) logsQuery = logsQuery.eq('company_id', companyId)

  // Today's attendance from attendance table
  let todayQuery = supabase
    .from('attendance')
    .select(`
      employee_id, check_in, check_out, status,
      employees!attendance_employee_id_fkey(job_title, profiles!employees_id_fkey(full_name))
    `)
    .eq('date', today)

  // Active employees for manual entry form
  let empQuery = supabase
    .from('employees')
    .select('id, job_title, profiles!employees_id_fkey(full_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(200)

  if (companyId) empQuery = empQuery.eq('company_id', companyId)

  const [logsResult, todayResult, empResult] = await Promise.all([logsQuery, todayQuery, empQuery])

  const logs = ((logsResult.data ?? []) as unknown as AttendanceLog[]).map((l) => ({
    ...l,
    profiles: Array.isArray(l.profiles) ? l.profiles[0] : l.profiles,
  }))

  const todayAttendance = (todayResult.data ?? []) as unknown as Array<{
    employee_id: string
    check_in: string | null
    check_out: string | null
    status: string | null
    employees: { job_title: string | null; profiles: { full_name: string | null } | { full_name: string | null }[] | null } | null
  }>

  const presentToday = todayAttendance.filter((a) => a.check_in && a.status !== 'blocked').length
  const blockedToday = todayAttendance.filter((a) => a.status === 'blocked').length
  const checkedOutToday = todayAttendance.filter((a) => a.check_out).length

  const canWrite = HR_WRITE_ROLES.includes(profile.role)
  const employees: EmployeeOption[] = ((empResult.data ?? []) as unknown as Array<{
    id: string; job_title: string | null
    profiles: { full_name: string | null } | { full_name: string | null }[] | null
  }>).map((e) => ({
    id: e.id,
    name: (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles)?.full_name ?? t('موظف', 'Employee'),
    jobTitle: e.job_title,
  }))

  // Monthly stats
  const presentLogs = logs.filter((l) => l.status === 'present')

  // Per-employee summary for the month
  const employeeSummary = Object.values(
    logs.reduce<Record<string, { name: string; present: number; absent: number; late: number; blocked: number; totalMinutes: number }>>((acc, log) => {
      const key = log.employee_id
      if (!acc[key]) acc[key] = { name: log.profiles?.full_name ?? t('موظف', 'Employee'), present: 0, absent: 0, late: 0, blocked: 0, totalMinutes: 0 }
      if (log.status === 'present') acc[key].present++
      if (log.status === 'absent') acc[key].absent++
      if (log.status === 'late') acc[key].late++
      if (log.status === 'blocked') acc[key].blocked++
      if (log.check_in && log.check_out) {
        acc[key].totalMinutes += (new Date(log.check_out).getTime() - new Date(log.check_in).getTime()) / 60_000
      }
      return acc
    }, {}),
  ).sort((a, b) => b.present - a.present)

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">ATTENDANCE INTELLIGENCE</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">{t('تقارير الحضور والانصراف', 'Attendance Reports')}</h1>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          {t('متابعة لحظية لحضور اليوم — إحصاءات شهرية لكل موظف — سجل حضور كامل.', "Real-time today's attendance — monthly stats per employee — full attendance log.")}
        </p>
      </section>

      <BentoGrid>
        <BentoKpiCard title={t('حاضرون اليوم', "Today's Present")} value={<AnimatedCount value={presentToday} />} hint={t('تسجيل دخول', 'Check-in')} icon={<CalendarDays className="size-5" />} />
        <BentoKpiCard title={t('انصراف اليوم', "Today's Check-outs")} value={<AnimatedCount value={checkedOutToday} />} hint={t('تسجيل خروج', 'Check-out')} icon={<Clock className="size-5" />} />
        <BentoKpiCard title={t('محجوبون اليوم', "Today's Blocked")} value={<AnimatedCount value={blockedToday} />} hint={t('خارج النطاق', 'Out of Range')} icon={<UserX className="size-5" />} />
        <BentoKpiCard title={t('حضور الشهر', 'Monthly Attendance')} value={<AnimatedCount value={presentLogs.length} />} hint={`${month}/${year}`} icon={<TrendingUp className="size-5" />} />
      </BentoGrid>

      {canWrite && <AttendanceEntryForm employees={employees} />}

      {/* Today's live attendance */}
      <section className="ds-card overflow-hidden">
        <div className="border-b border-[var(--fi-line)] p-5">
          <h2 className="text-xl font-black text-[var(--fi-ink)]">{t('حضور اليوم', "Today's Attendance")} — {formatDate(now.toISOString().slice(0, 10))}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">{t('الموظف', 'Employee')}</th>
                <th className="px-4 py-3 text-right">{t('تسجيل دخول', 'Check-in')}</th>
                <th className="px-4 py-3 text-right">{t('تسجيل خروج', 'Check-out')}</th>
                <th className="px-4 py-3 text-right">{t('مدة العمل', 'Duration')}</th>
                <th className="px-4 py-3 text-right">{t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {todayAttendance.map((att) => {
                const emp = att.employees
                const empProfiles = emp?.profiles
                const name = (Array.isArray(empProfiles) ? empProfiles[0] : empProfiles)?.full_name ?? t('موظف', 'Employee')
                return (
                  <tr key={att.employee_id} className="transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{name}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{formatTime(att.check_in)}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{formatTime(att.check_out)}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{calcDuration(att.check_in, att.check_out, hLabel, mLabel) ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadge[att.status ?? 'present'] ?? 'bg-slate-100 text-slate-600'}`}>
                        {statusLabel[att.status ?? 'present'] ?? att.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!todayAttendance.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm font-bold text-[var(--fi-muted)]">
                    {t('لم يسجّل أي موظف حضوراً اليوم بعد.', 'No employee has checked in today yet.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Monthly employee summary */}
      {employeeSummary.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">{t('ملخص الشهر لكل موظف', 'Monthly Summary per Employee')} — {month}/{year}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">{t('الموظف', 'Employee')}</th>
                  <th className="px-4 py-3 text-right">{t('حضور', 'Present')}</th>
                  <th className="px-4 py-3 text-right">{t('غياب', 'Absent')}</th>
                  <th className="px-4 py-3 text-right">{t('تأخير', 'Late')}</th>
                  <th className="px-4 py-3 text-right">{t('محجوب', 'Blocked')}</th>
                  <th className="px-4 py-3 text-right">{t('متوسط ساعات/يوم', 'Avg Hours/Day')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {employeeSummary.map((emp, i) => {
                  const avgHours = emp.present > 0 ? emp.totalMinutes / emp.present / 60 : 0
                  return (
                    <tr key={i} className="transition hover:bg-[var(--fi-soft)]/60">
                      <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{emp.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{emp.present}</span>
                      </td>
                      <td className="px-4 py-3">
                        {emp.absent > 0 ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">{emp.absent}</span> : <span className="text-[var(--fi-muted)]">0</span>}
                      </td>
                      <td className="px-4 py-3">
                        {emp.late > 0 ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{emp.late}</span> : <span className="text-[var(--fi-muted)]">0</span>}
                      </td>
                      <td className="px-4 py-3">
                        {emp.blocked > 0 ? <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">{emp.blocked}</span> : <span className="text-[var(--fi-muted)]">0</span>}
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">
                        {avgHours > 0 ? `${avgHours.toFixed(1)}${hLabel}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Full attendance log */}
      <section className="ds-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--fi-line)] p-5">
          <h2 className="text-xl font-black text-[var(--fi-ink)]">{t('سجل الحضور الكامل', 'Full Attendance Log')}</h2>
          <span className="text-sm font-bold text-[var(--fi-muted)]">{logs.length} {t('سجل', 'records')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">{t('التاريخ', 'Date')}</th>
                <th className="px-4 py-3 text-right">{t('الموظف', 'Employee')}</th>
                <th className="px-4 py-3 text-right">{t('دخول', 'Check-in')}</th>
                <th className="px-4 py-3 text-right">{t('خروج', 'Check-out')}</th>
                <th className="px-4 py-3 text-right">{t('مدة العمل', 'Duration')}</th>
                <th className="px-4 py-3 text-right">{t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-[var(--fi-soft)]/60">
                  <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{formatDate(log.log_date)}</td>
                  <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{log.profiles?.full_name ?? t('غير محدد', 'Unknown')}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{formatTime(log.check_in)}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{formatTime(log.check_out)}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{calcDuration(log.check_in, log.check_out, hLabel, mLabel) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadge[log.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {statusLabel[log.status] ?? log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm font-bold text-[var(--fi-muted)]">
                    {t('لا توجد سجلات حضور لهذا الشهر.', 'No attendance records for this month.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
