import { BadgeDollarSign, CalendarDays, FileDown, ShieldCheck } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { SmartAttendanceWidget, type SmartAttendanceEmployee } from '../erp/hr/SmartAttendanceWidget'

export const dynamic = 'force-dynamic'

type EmployeeRow = {
  id: string
  user_id: string | null
  job_title: string | null
  basic_salary: number | null
  base_salary: number | null
  is_env_locked: boolean | null
  profiles: {
    full_name: string | null
    email: string | null
  } | null
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
  total_commissions: number | null
  deductions: number | null
  net_salary: number | null
}

const formatter = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })

export default async function EmployeePortalPage() {
  const session = await requireSession()
  const supabase = await createRawClient()
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { data: employeeData, error: employeeError } = await supabase
    .from('employees')
    .select('id, user_id, job_title, basic_salary, base_salary, is_env_locked, profiles!employees_id_fkey(full_name, email)')
    .or(`user_id.eq.${session.user.id},id.eq.${session.user.id}`)
    .maybeSingle()

  const employee = employeeData as unknown as EmployeeRow | null
  const profile = employee
    ? Array.isArray(employee.profiles) ? employee.profiles[0] : employee.profiles
    : null

  const [attendanceResult, payrollResult] = employee
    ? await Promise.all([
      supabase
        .from('attendance')
        .select('date, check_in, check_out, status')
        .eq('employee_id', employee.id)
        .order('date', { ascending: false })
        .limit(30),
      supabase
        .from('payroll')
        .select('month, year, total_commissions, deductions, net_salary')
        .eq('employee_id', employee.id)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle(),
    ])
    : [{ data: [], error: null }, { data: null, error: null }]

  const attendanceRows = (attendanceResult.data ?? []) as AttendanceRow[]
  const payroll = payrollResult.data as PayrollRow | null
  const todayAttendance = attendanceRows.find((row) => row.date === today)
  const presentDays = attendanceRows.filter((row) => row.check_in && row.status !== 'blocked').length
  const blockedDays = attendanceRows.filter((row) => row.status === 'blocked').length

  const smartEmployee: SmartAttendanceEmployee | null = employee
    ? {
      id: employee.id,
      fullName: profile?.full_name ?? session.profile.full_name ?? 'موظف',
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
              بوابة الموظف
            </h1>
            <p className="mt-2 text-sm font-semibold text-[var(--fi-muted)]">
              حضورك، راتبك، عمولاتك، وكشوف الشهر في واجهة شخصية آمنة.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--fi-soft)] px-3 py-2 text-xs font-black text-[var(--fi-emerald)]">
            <ShieldCheck className="size-4" />
            {employee?.is_env_locked ? 'بيئة العمل مربوطة' : 'في انتظار ربط البيئة'}
          </span>
        </div>
      </section>

      {employeeError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          تعذر تحميل ملف الموظف: {employeeError.message}
        </section>
      ) : null}

      <BentoGrid>
        <BentoKpiCard
          title="أيام الحضور"
          value={<AnimatedCount value={presentDays} />}
          hint="آخر 30 يوم"
          icon={<CalendarDays className="size-5" />}
        />
        <BentoKpiCard
          title="محاولات مرفوضة"
          value={<AnimatedCount value={blockedDays} />}
          hint="خارج النطاق"
          icon={<ShieldCheck className="size-5" />}
        />
        <BentoKpiCard
          title="عمولات الشهر"
          value={<><AnimatedCount value={Number(payroll?.total_commissions ?? 0)} /> <span className="text-base">ج.م</span></>}
          hint={`${month}/${year}`}
          icon={<BadgeDollarSign className="size-5" />}
        />
        <BentoKpiCard
          title="صافي المستحق"
          value={<><AnimatedCount value={Number(payroll?.net_salary ?? employee?.basic_salary ?? employee?.base_salary ?? 0)} /> <span className="text-base">ج.م</span></>}
          hint="راتب + عمولة - خصومات"
          icon={<FileDown className="size-5" />}
        />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
        <SmartAttendanceWidget employee={smartEmployee} />

        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">سجل الحضور الشهري</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">آخر 30 عملية حضور وانصراف.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
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
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{new Date(row.date).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-3 text-[var(--fi-muted)]">{formatTime(row.check_in)}</td>
                    <td className="px-4 py-3 text-[var(--fi-muted)]">{formatTime(row.check_out)}</td>
                    <td className="px-4 py-3">{labelStatus(row.status)}</td>
                  </tr>
                ))}
                {!attendanceRows.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center font-bold text-[var(--fi-muted)]">
                      لا يوجد سجل حضور حتى الآن.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--fi-line)] p-4">
            <button className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-4 text-sm font-black text-[var(--fi-ink)] transition hover:border-[var(--fi-emerald)] dark:bg-white/5">
              <FileDown className="size-4" />
              تحميل كشف الراتب
            </button>
            <p className="mt-2 text-center text-xs font-bold text-[var(--fi-muted)]">
              صافي الشهر الحالي: {formatter.format(Number(payroll?.net_salary ?? 0))} ج.م
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function formatTime(value: string | null | undefined) {
  if (!value) return '...'
  return new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function labelStatus(status: string | null | undefined) {
  const labels: Record<string, string> = {
    present: 'حاضر',
    blocked: 'خارج النطاق',
    absent: 'غائب',
    late: 'متأخر',
    leave: 'إجازة',
    remote: 'عن بعد',
  }
  const danger = status === 'blocked' || status === 'absent'
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${
      danger ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
    }`}>
      {labels[status ?? ''] ?? 'غير محدد'}
    </span>
  )
}
