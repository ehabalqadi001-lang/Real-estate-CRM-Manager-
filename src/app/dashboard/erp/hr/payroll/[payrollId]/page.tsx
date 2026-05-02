import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import {
  ArrowRight,
  Building2,
  WalletCards,
  TrendingDown,
  ShieldCheck,
  Receipt,
  CalendarDays,
  User,
} from 'lucide-react'
import { PrintButton } from './PrintButton'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']

const MONTH_NAMES: Record<number, string> = {
  1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل',
  5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس',
  9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر',
}

const fmt = (n: number | null | undefined) =>
  n != null ? new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(n) : '٠'

const statusLabel: Record<string, string> = {
  draft:    'مسودة',
  approved: 'مُقرَّر',
  paid:     'مدفوع',
}

const statusCls: Record<string, string> = {
  draft:    'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid:     'bg-blue-50 text-blue-700 border-blue-200',
}

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ payrollId: string }>
}) {
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const { payrollId } = await params
  const supabase   = await createRawClient()
  const companyId  = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  const { data: rawRow } = await supabase
    .from('payroll')
    .select(`
      id, employee_id, month, year,
      basic_salary, allowances, bonus, overtime_amount,
      present_days, absent_days, late_count,
      total_commissions, deductions,
      unpaid_leave_days, unpaid_leave_deduct,
      social_ins_emp, tax_amount,
      gross_salary, net_salary, status,
      employees!payroll_employee_id_fkey(
        job_title, department_id, national_id,
        hire_date, bank_name, bank_account,
        profiles(full_name, email, avatar_url)
      )
    `)
    .eq('id', payrollId)
    .single()

  if (!rawRow) notFound()

  // company isolation
  if (companyId) {
    const { data: empCheck } = await supabase
      .from('employees')
      .select('id')
      .eq('id', rawRow.employee_id)
      .eq('company_id', companyId)
      .single()
    if (!empCheck) notFound()
  }

  const emp = Array.isArray(rawRow.employees) ? rawRow.employees[0] : rawRow.employees
  const empProfile = emp ? (Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles) : null

  const employeeName = empProfile?.full_name ?? 'موظف'
  const jobTitle     = emp?.job_title ?? '—'
  const nationalId   = emp?.national_id ?? '—'
  const hireDate     = emp?.hire_date
    ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(emp.hire_date))
    : '—'
  const bankName     = emp?.bank_name ?? '—'
  const bankAccount  = emp?.bank_account ?? '—'

  const row = rawRow as typeof rawRow & {
    basic_salary: number; allowances: number; bonus: number; overtime_amount: number
    present_days: number; absent_days: number; late_count: number
    total_commissions: number; deductions: number
    unpaid_leave_days: number; unpaid_leave_deduct: number
    social_ins_emp: number; tax_amount: number
    gross_salary: number; net_salary: number
    status: string; month: number; year: number
  }

  const absentDeduct = Number(row.basic_salary) > 0 && Number(row.absent_days) > 0
    ? (Number(row.basic_salary) / 30) * Number(row.absent_days)
    : 0

  const st = statusCls[row.status] ?? statusCls.draft

  return (
    <main className="space-y-6 p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Back + Print */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/erp/hr/payroll"
          className="flex items-center gap-2 text-sm font-bold text-[var(--fi-muted)] hover:text-[var(--fi-ink)] transition"
        >
          <ArrowRight size={16} />
          العودة لمسيرة الرواتب
        </Link>
        <PrintButton />
      </div>

      {/* Payslip card */}
      <div className="bg-[var(--fi-paper)] rounded-2xl border border-[var(--fi-line)] shadow-sm overflow-hidden print:shadow-none print:border-none">

        {/* Header */}
        <div className="bg-gradient-to-l from-[var(--fi-emerald)] to-emerald-700 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">FAST INVESTMENT</p>
                <p className="text-white font-black text-lg mt-0.5">كشف راتب</p>
                <p className="text-emerald-200 text-sm">
                  {MONTH_NAMES[row.month]} {row.year}
                </p>
              </div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${st}`}>
              {statusLabel[row.status] ?? row.status}
            </span>
          </div>
        </div>

        {/* Employee info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x-reverse sm:divide-x divide-[var(--fi-line)] border-b border-[var(--fi-line)]">
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-[var(--fi-muted)] uppercase tracking-widest">
              <User size={13} />
              بيانات الموظف
            </div>
            <div className="space-y-2">
              <InfoRow label="الاسم"           value={employeeName} bold />
              <InfoRow label="المسمى الوظيفي"  value={jobTitle} />
              <InfoRow label="الرقم القومي"    value={nationalId} />
              <InfoRow label="تاريخ التعيين"   value={hireDate} />
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-[var(--fi-muted)] uppercase tracking-widest">
              <CalendarDays size={13} />
              بيانات الدوام
            </div>
            <div className="space-y-2">
              <InfoRow label="أيام الحضور"   value={`${row.present_days ?? 0} يوم`} />
              <InfoRow label="أيام الغياب"   value={`${row.absent_days  ?? 0} يوم`} />
              <InfoRow label="مرات التأخير"  value={`${row.late_count   ?? 0} مرة`} />
              <InfoRow label="إجازات بدون راتب" value={`${row.unpaid_leave_days ?? 0} يوم`} />
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div className="p-5 space-y-3">
          <SectionTitle icon={<WalletCards size={15} />} label="المستحقات" color="text-emerald-600" />
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--fi-line)]">
              <PayslipRow label="الراتب الأساسي"    value={row.basic_salary}    color="text-[var(--fi-ink)]" />
              <PayslipRow label="البدلات"            value={row.allowances}      color="text-[var(--fi-ink)]" />
              <PayslipRow label="العلاوات والحوافز" value={row.bonus}            color="text-[var(--fi-ink)]" />
              <PayslipRow label="أوفر تايم"          value={row.overtime_amount} color="text-[var(--fi-ink)]" />
              <PayslipRow label="العمولات"           value={row.total_commissions} color="text-emerald-600" />
            </tbody>
            <tfoot>
              <tr className="bg-emerald-50">
                <td className="px-3 py-2.5 font-black text-emerald-700">إجمالي المستحقات</td>
                <td className="px-3 py-2.5 text-left font-black text-emerald-700">
                  {fmt(row.gross_salary)} ج.م
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Deductions */}
        <div className="p-5 space-y-3 border-t border-[var(--fi-line)]">
          <SectionTitle icon={<TrendingDown size={15} />} label="الخصومات" color="text-red-600" />
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--fi-line)]">
              <PayslipRow label="التأمينات الاجتماعية (11%)" value={row.social_ins_emp}      color="text-red-600" />
              <PayslipRow label="ضريبة الدخل"                value={row.tax_amount}          color="text-red-600" />
              {absentDeduct > 0 && (
                <PayslipRow label="خصم الغياب"               value={absentDeduct}             color="text-red-600" />
              )}
              {Number(row.unpaid_leave_deduct ?? 0) > 0 && (
                <PayslipRow label="خصم إجازات بدون راتب"     value={row.unpaid_leave_deduct}  color="text-red-600" />
              )}
              {Number(row.deductions ?? 0) > 0 && (
                <PayslipRow label="خصومات أخرى"              value={row.deductions}           color="text-red-600" />
              )}
            </tbody>
          </table>
        </div>

        {/* Net salary */}
        <div className="p-5 border-t border-[var(--fi-line)]">
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-l from-[var(--fi-emerald)] to-emerald-700 px-6 py-4 text-white">
            <span className="text-sm font-black">صافي الراتب</span>
            <span className="text-2xl font-black">{fmt(row.net_salary)} ج.م</span>
          </div>
        </div>

        {/* Bank details */}
        {(bankName !== '—' || bankAccount !== '—') && (
          <div className="p-5 border-t border-[var(--fi-line)] space-y-3">
            <SectionTitle icon={<Receipt size={15} />} label="بيانات التحويل البنكي" color="text-blue-600" />
            <div className="flex flex-col sm:flex-row gap-4">
              <InfoRow label="البنك"   value={bankName}    />
              <InfoRow label="رقم الحساب" value={bankAccount} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[var(--fi-line)] bg-[var(--fi-soft)] px-5 py-3 flex items-center justify-between text-xs text-[var(--fi-muted)]">
          <span>تاريخ الإصدار: {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date())}</span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" />
            وثيقة رسمية صادرة من نظام FAST INVESTMENT CRM
          </span>
        </div>
      </div>
    </main>
  )
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[var(--fi-muted)]">{label}</span>
      <span className={`text-sm ${bold ? 'font-black text-[var(--fi-ink)]' : 'font-bold text-[var(--fi-ink)]'}`}>
        {value}
      </span>
    </div>
  )
}

function SectionTitle({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${color}`}>
      {icon}
      {label}
    </div>
  )
}

function PayslipRow({
  label,
  value,
  color,
}: {
  label: string
  value: number | null | undefined
  color: string
}) {
  const n = Number(value ?? 0)
  if (n === 0) return null

  return (
    <tr>
      <td className="px-3 py-2 text-[var(--fi-muted)]">{label}</td>
      <td className={`px-3 py-2 text-left font-bold ${color}`}>{fmt(n)} ج.م</td>
    </tr>
  )
}
