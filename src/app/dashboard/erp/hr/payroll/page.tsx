import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WalletCards, BadgeDollarSign, Users, CheckCircle2, Download } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { RunPayrollForm, ApprovePayrollButton, ApproveAllButton } from './PayrollControls'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const PAYROLL_RUN_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager']

type PayrollRow = {
  id: string
  employee_id: string
  month: number
  year: number
  basic_salary: number
  present_days: number
  absent_days: number
  late_count: number
  total_commissions: number
  deductions: number
  gross_salary: number
  net_salary: number
  status: string
  employees: {
    job_title: string | null
    department_id: string | null
    profiles: { full_name: string | null } | null
  } | null
}

const formatter = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })

const statusBadge: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  paid: 'bg-blue-50 text-blue-700',
}
const statusLabel: Record<string, string> = {
  draft: 'مسودة',
  approved: 'مُقرَّر',
  paid: 'مدفوع',
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const params = await searchParams
  const now = new Date()
  const month = Number(params.month ?? now.getMonth() + 1)
  const year = Number(params.year ?? now.getFullYear())

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  let payrollQuery = supabase
    .from('payroll')
    .select(`
      id, employee_id, month, year,
      basic_salary, present_days, absent_days, late_count,
      total_commissions, deductions, gross_salary, net_salary, status,
      employees!payroll_employee_id_fkey(job_title, department_id, profiles(full_name))
    `)
    .eq('month', month)
    .eq('year', year)
    .order('net_salary', { ascending: false })

  if (companyId) payrollQuery = payrollQuery.eq('company_id', companyId)

  const { data: payrollData, error: payrollError } = await payrollQuery

  const payroll = ((payrollData ?? []) as unknown as PayrollRow[]).map((p) => {
    const emp = Array.isArray(p.employees) ? p.employees[0] : p.employees
    return {
      ...p,
      employees: emp
        ? {
            ...emp,
            profiles: Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles,
          }
        : null,
    }
  })

  const canRun = PAYROLL_RUN_ROLES.includes(profile.role)
  const totalNetSalary = payroll.reduce((s, p) => s + Number(p.net_salary ?? 0), 0)
  const totalCommissions = payroll.reduce((s, p) => s + Number(p.total_commissions ?? 0), 0)
  const totalDeductions = payroll.reduce((s, p) => s + Number(p.deductions ?? 0), 0)
  const approvedCount = payroll.filter((p) => p.status === 'approved' || p.status === 'paid').length
  const draftCount = payroll.filter((p) => p.status === 'draft').length

  // Month navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">PAYROLL MANAGEMENT</p>
            <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">مسيرة رواتب</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
              الراتب الأساسي + العمولات المُقرَّرة — خصم الغياب والتأخير تلقائياً.
            </p>
          </div>
          {/* Month selector */}
          <div className="flex items-center gap-2 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2">
            <Link href={`?month=${prevMonth}&year=${prevYear}`} className="text-[var(--fi-muted)] transition hover:text-[var(--fi-ink)]">
              ›
            </Link>
            <span className="min-w-[120px] text-center text-sm font-black text-[var(--fi-ink)]">
              {new Date(year, month - 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
            </span>
            <Link href={`?month=${nextMonth}&year=${nextYear}`} className="text-[var(--fi-muted)] transition hover:text-[var(--fi-ink)]">
              ‹
            </Link>
          </div>
        </div>
      </section>

      {payrollError && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          تعذر تحميل بيانات المسيرة: {payrollError.message}
        </section>
      )}

      <BentoGrid>
        <BentoKpiCard
          title="إجمالي صافي الرواتب"
          value={<><AnimatedCount value={totalNetSalary} /> <span className="text-base">ج.م</span></>}
          hint={`${month}/${year}`}
          icon={<WalletCards className="size-5" />}
        />
        <BentoKpiCard
          title="إجمالي العمولات"
          value={<><AnimatedCount value={totalCommissions} /> <span className="text-base">ج.م</span></>}
          hint="مُقرَّرة ومحتسبة"
          icon={<BadgeDollarSign className="size-5" />}
        />
        <BentoKpiCard
          title="موظفون مُقرَّرة رواتبهم"
          value={<AnimatedCount value={approvedCount} />}
          hint={`${draftCount} مسودة`}
          icon={<CheckCircle2 className="size-5" />}
        />
        <BentoKpiCard
          title="إجمالي الاستقطاعات"
          value={<><AnimatedCount value={totalDeductions} /> <span className="text-base">ج.م</span></>}
          hint="غياب + تأخير"
          icon={<Users className="size-5" />}
        />
      </BentoGrid>

      {canRun && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,auto)]">
          <RunPayrollForm defaultMonth={month} defaultYear={year} />
          <section className="ds-card p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">آلية الاحتساب</p>
            <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">قواعد المسيرة</h2>
            <div className="mt-4 space-y-3 text-sm font-bold text-[var(--fi-muted)]">
              <div className="flex gap-2"><span className="text-[var(--fi-emerald)]">+</span> الراتب الأساسي الشهري</div>
              <div className="flex gap-2"><span className="text-[var(--fi-emerald)]">+</span> العمولات المُقرَّرة من محرك العمولات</div>
              <div className="flex gap-2"><span className="text-red-500">−</span> يوم راتب لكل يوم غياب</div>
              <div className="flex gap-2"><span className="text-red-500">−</span> ربع يوم لكل تأخير مسجّل</div>
              <div className="mt-3 rounded-lg bg-[var(--fi-soft)] p-3 text-xs">
                معادلة اليوم = الراتب الأساسي ÷ أيام العمل (22 افتراضياً)
              </div>
            </div>
          </section>
        </div>
      )}

      {payroll.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[var(--fi-line)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[var(--fi-ink)]">
                مسيرة {new Date(year, month - 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="mt-1 text-sm font-bold text-[var(--fi-muted)]">{payroll.length} موظف</p>
            </div>
            <div className="flex gap-3">
              {canRun && draftCount > 0 && companyId && (
                <ApproveAllButton month={month} year={year} companyId={companyId} />
              )}
              <Link
                href={`/api/erp/payroll/preview?month=${month}&year=${year}`}
                target="_blank"
                className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-4 text-sm font-black text-[var(--fi-ink)] transition hover:border-[var(--fi-emerald)] dark:bg-white/5"
              >
                <Download className="size-4" />
                تصدير PDF
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">الموظف</th>
                  <th className="px-4 py-3 text-right">أيام حضور</th>
                  <th className="px-4 py-3 text-right">غياب / تأخير</th>
                  <th className="px-4 py-3 text-right">الراتب الأساسي</th>
                  <th className="px-4 py-3 text-right">عمولات</th>
                  <th className="px-4 py-3 text-right">استقطاعات</th>
                  <th className="px-4 py-3 text-right">الإجمالي</th>
                  <th className="px-4 py-3 text-right">الصافي</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  {canRun && <th className="px-4 py-3 text-right">إجراء</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {payroll.map((p) => (
                  <tr key={p.employee_id} className="transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3">
                      <p className="font-black text-[var(--fi-ink)]">{p.employees?.profiles?.full_name ?? 'غير محدد'}</p>
                      <p className="mt-0.5 text-xs text-[var(--fi-muted)]">{p.employees?.job_title ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{p.present_days ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-red-600">{p.absent_days ?? 0}</span>
                      <span className="mx-1 text-[var(--fi-muted)]">/</span>
                      <span className="font-bold text-amber-600">{p.late_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{formatter.format(p.basic_salary)} ج.م</td>
                    <td className="px-4 py-3 font-black text-emerald-600">
                      {p.total_commissions > 0 ? `${formatter.format(p.total_commissions)} ج.م` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-red-500">
                      {p.deductions > 0 ? `(${formatter.format(p.deductions)}) ج.م` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{formatter.format(p.gross_salary)} ج.م</td>
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)] text-base">{formatter.format(p.net_salary)} ج.م</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadge[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {statusLabel[p.status] ?? p.status}
                      </span>
                    </td>
                    {canRun && (
                      <td className="px-4 py-3">
                        {p.status === 'draft' && (
                          <ApprovePayrollButton employeeId={p.employee_id} month={month} year={year} />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--fi-line)] bg-[var(--fi-soft)] font-black">
                  <td className="px-4 py-3 text-[var(--fi-ink)]" colSpan={3}>الإجماليات</td>
                  <td className="px-4 py-3 text-[var(--fi-ink)]">{formatter.format(payroll.reduce((s, p) => s + p.basic_salary, 0))} ج.م</td>
                  <td className="px-4 py-3 text-emerald-600">{formatter.format(totalCommissions)} ج.م</td>
                  <td className="px-4 py-3 text-red-500">({formatter.format(totalDeductions)}) ج.م</td>
                  <td className="px-4 py-3 text-[var(--fi-ink)]">{formatter.format(payroll.reduce((s, p) => s + p.gross_salary, 0))} ج.م</td>
                  <td className="px-4 py-3 text-emerald-700 text-base">{formatter.format(totalNetSalary)} ج.م</td>
                  <td colSpan={canRun ? 2 : 1} />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {!payroll.length && !payrollError && (
        <section className="ds-card p-10 text-center">
          <WalletCards className="mx-auto mb-3 size-10 text-[var(--fi-muted)]" />
          <p className="font-black text-[var(--fi-ink)]">لا توجد مسيرة لهذا الشهر</p>
          <p className="mt-1 text-sm font-bold text-[var(--fi-muted)]">
            {canRun ? 'استخدم نموذج الإصدار أعلاه لإنشاء المسيرة.' : 'تواصل مع مدير الموارد البشرية لإصدار المسيرة.'}
          </p>
        </section>
      )}
    </main>
  )
}
