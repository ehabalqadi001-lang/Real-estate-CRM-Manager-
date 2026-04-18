import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { Users, TrendingUp, Clock, DollarSign, Award, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

const fmtFull = (n: number) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function ERPHRPage() {
  const session = await requireSession()
  const { profile } = session

  const allowedRoles = ['super_admin', 'hr_manager', 'hr_officer', 'finance_manager']
  if (!allowedRoles.includes(profile.role ?? '')) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = profile.company_id

  const now = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const [
    { data: employees },
    { data: commissions },
    { data: attendance },
    { data: payrollRuns },
  ] = await Promise.all([
    supabase
      .from('employees')
      .select('id, employee_number, base_salary, hire_date, department_id, profile:profiles!employees_id_fkey(full_name, role, email)')
      .eq('company_id', companyId)
      .is('termination_date', null)
      .order('employee_number'),

    supabase
      .from('commission_calculations')
      .select('employee_id, total_commission, status')
      .eq('company_id', companyId)
      .eq('period_month', month)
      .eq('period_year', year),

    supabase
      .from('attendance_logs')
      .select('employee_id, status')
      .eq('company_id', companyId)
      .gte('log_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('log_date', new Date(year, month, 0).toISOString().split('T')[0]),

    supabase
      .from('payroll_runs')
      .select('id, period_month, period_year, total_net, status, run_date')
      .eq('company_id', companyId)
      .order('run_date', { ascending: false })
      .limit(5),
  ])

  const totalHeadcount   = employees?.length ?? 0
  const totalPayroll     = employees?.reduce((s, e) => s + Number(e.base_salary ?? 0), 0) ?? 0
  const totalCommissions = commissions?.reduce((s, c) => s + Number(c.total_commission ?? 0), 0) ?? 0
  const absentToday      = attendance?.filter(a => a.status === 'absent').length ?? 0
  const presentToday     = attendance?.filter(a => a.status === 'present').length ?? 0

  const commByEmployee = new Map<string, number>()
  for (const c of commissions ?? []) {
    commByEmployee.set(c.employee_id, (commByEmployee.get(c.employee_id) ?? 0) + Number(c.total_commission))
  }

  return (
    <div className="p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">إدارة الموارد البشرية</h1>
            <p className="text-xs text-[var(--fi-muted)]">الموظفون · الحضور · العمولات · الرواتب</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/api/erp/payroll/preview?month=${month}&year=${year}`}
            target="_blank"
            className="flex items-center gap-2 border border-violet-300 text-violet-700 px-3 py-2 rounded-xl text-sm font-bold hover:bg-violet-50 transition-colors"
          >
            <DollarSign size={14} /> معاينة الراتب
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الموظفين', value: totalHeadcount, icon: Users, color: 'bg-violet-50 text-violet-600', suffix: '' },
          { label: 'إجمالي الرواتب الأساسية', value: totalPayroll, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', suffix: ' ج.م' },
          { label: 'عمولات الشهر', value: totalCommissions, icon: Award, color: 'bg-amber-50 text-amber-600', suffix: ' ج.م' },
          { label: 'حاضر / غائب اليوم', value: presentToday, icon: Clock, color: 'bg-sky-50 text-sky-600', suffix: ` / ${absentToday}` },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${kpi.color} rounded-lg flex items-center justify-center`}>
                <kpi.icon size={15} />
              </div>
              <span className="text-xs text-[var(--fi-muted)]">{kpi.label}</span>
            </div>
            <p className="text-2xl font-black text-[var(--fi-ink)]">
              {typeof kpi.value === 'number' && kpi.value > 9999 ? fmt(kpi.value) : kpi.value}{kpi.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Employee table */}
      <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--fi-line)]">
          <h2 className="font-bold text-[var(--fi-ink)]">الموظفون النشطون</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-[var(--fi-muted)] text-xs">
                <th className="text-right px-4 py-3">رقم الموظف</th>
                <th className="text-right px-4 py-3">الاسم</th>
                <th className="text-right px-4 py-3">الدور</th>
                <th className="text-right px-4 py-3">الراتب الأساسي</th>
                <th className="text-right px-4 py-3">عمولة الشهر</th>
                <th className="text-right px-4 py-3">تاريخ التعيين</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {(employees ?? []).map(emp => {
                const p = Array.isArray(emp.profile) ? emp.profile[0] : emp.profile
                const comm = commByEmployee.get(emp.id) ?? 0
                return (
                  <tr key={emp.id} className="hover:bg-[var(--fi-soft)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--fi-muted)]">{emp.employee_number}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--fi-ink)]">{p?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--fi-muted)]">{p?.role ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{fmtFull(Number(emp.base_salary ?? 0))} ج.م</td>
                    <td className="px-4 py-3">
                      {comm > 0
                        ? <span className="text-emerald-600 font-bold">{fmtFull(comm)} ج.م</span>
                        : <span className="text-[var(--fi-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[var(--fi-muted)] text-xs">
                      {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('ar-EG') : '—'}
                    </td>
                  </tr>
                )
              })}
              {!employees?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--fi-muted)]">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-40" />
                    لا يوجد موظفون نشطون
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent payroll runs */}
      {(payrollRuns?.length ?? 0) > 0 && (
        <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--fi-line)]">
            <h2 className="font-bold text-[var(--fi-ink)]">آخر مسيرات الرواتب</h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {(payrollRuns ?? []).map(run => (
              <div key={run.id} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--fi-soft)]">
                <div>
                  <p className="font-semibold text-[var(--fi-ink)] text-sm">
                    {run.period_month}/{run.period_year}
                  </p>
                  <p className="text-xs text-[var(--fi-muted)]">{new Date(run.run_date).toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="text-left">
                  <p className="font-black text-[var(--fi-ink)]">{fmtFull(Number(run.total_net ?? 0))} ج.م</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    run.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    run.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{run.status === 'paid' ? 'مدفوع' : run.status === 'approved' ? 'معتمد' : 'مسودة'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commission pipeline link */}
      <div className="flex gap-3">
        <Link href="/dashboard/commissions" className="flex-1 bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-4 hover:border-violet-300 transition-colors flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
            <TrendingUp size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-[var(--fi-ink)] text-sm">العمولات</p>
            <p className="text-xs text-[var(--fi-muted)]">خط أنابيب العمولات للشهر الحالي</p>
          </div>
        </Link>
        <Link href="/dashboard/team" className="flex-1 bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-4 hover:border-violet-300 transition-colors flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
            <Users size={16} className="text-violet-600" />
          </div>
          <div>
            <p className="font-bold text-[var(--fi-ink)] text-sm">الفريق</p>
            <p className="text-xs text-[var(--fi-muted)]">إدارة أعضاء الفريق والأدوار</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
