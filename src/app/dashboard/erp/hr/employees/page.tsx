import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Search } from 'lucide-react'
import { nullableUuid } from '@/lib/uuid'
import type { AppRole } from '@/shared/auth/types'
import { getI18n } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = [
  'super_admin', 'platform_admin',
  'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager',
  'company_admin', 'company_owner',
]


type EmpRow = {
  id: string
  employee_number: string
  job_title: string | null
  hire_date: string | null
  basic_salary: number | null
  base_salary: number | null
  status: string | null
  is_env_locked: boolean | null
  department_id: string | null
  commission_rate: number | null
  profiles: { full_name: string | null; email: string | null; role: string | null } | null
}

export default async function EmployeeListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; status?: string }>
}) {
  const { t, numLocale } = await getI18n()
  const fmt = new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 })
  const session = await requireSession()
  const { profile } = session

  if (!HR_ROLES.includes(profile.role as AppRole)) redirect('/dashboard')

  const params = await searchParams
  const q      = params.q?.trim() ?? ''
  const dept   = params.dept ?? ''
  const status = params.status ?? 'active'

  const supabase  = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  let empQuery = supabase
    .from('employees')
    .select(`
      id, employee_number, job_title, hire_date,
      basic_salary, base_salary, status, is_env_locked,
      department_id, commission_rate,
      profiles!employees_id_fkey(full_name, email, role)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (companyId) empQuery = empQuery.eq('company_id', companyId)
  if (status)    empQuery = empQuery.eq('status', status)

  const [{ data: employeesRaw }, { data: departments }] = await Promise.all([
    empQuery,
    supabase.from('departments').select('id, name, name_ar').order('name'),
  ])

  let employees = ((employeesRaw ?? []) as unknown as EmpRow[]).map(e => ({
    ...e,
    profiles: Array.isArray(e.profiles) ? e.profiles[0] : e.profiles,
  }))

  if (q) {
    const lower = q.toLowerCase()
    employees = employees.filter(e =>
      (e.profiles?.full_name ?? '').toLowerCase().includes(lower) ||
      (e.profiles?.email ?? '').toLowerCase().includes(lower) ||
      (e.employee_number ?? '').toLowerCase().includes(lower) ||
      (e.job_title ?? '').toLowerCase().includes(lower),
    )
  }
  if (dept) employees = employees.filter(e => e.department_id === dept)

  const deptMap: Record<string, string> = Object.fromEntries(
    (departments ?? []).map(d => [d.id, d.name_ar ?? d.name]),
  )

  const statusCounts = {
    active:     employees.filter(e => e.status === 'active').length,
    inactive:   employees.filter(e => e.status === 'inactive').length,
    terminated: employees.filter(e => e.status === 'terminated').length,
  }

  return (
    <main className="space-y-5 p-4 sm:p-6">
      {/* Header */}
      <section className="ds-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">EMPLOYEE DIRECTORY</p>
            <h1 className="mt-1 text-2xl font-black text-[var(--fi-ink)]">{t('دليل الموظفين', 'Employee Directory')}</h1>
            <p className="mt-0.5 text-sm font-semibold text-[var(--fi-muted)]">
              {employees.length} {t('موظف', 'employees')}
              {status === 'active' && ` · ${statusCounts.active} ${t('نشط', 'active')}`}
            </p>
          </div>
          <Link
            href="/dashboard/erp/hr"
            className="flex w-fit items-center gap-2 rounded-xl border border-[var(--fi-line)] px-4 py-2 text-sm font-bold text-[var(--fi-muted)] hover:bg-[var(--fi-soft)] transition-colors"
          >
            ← {t('لوحة HR', 'HR Dashboard')}
          </Link>
        </div>
      </section>

      {/* Filters */}
      <form method="get" className="ds-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fi-muted)]" />
          <input
            name="q"
            defaultValue={q}
            placeholder={t('البحث بالاسم أو البريد أو رقم الموظف...', 'Search by name, email, or employee number...')}
            className="h-10 w-full rounded-lg border border-[var(--fi-line)] bg-white pr-9 pl-3 text-sm font-bold text-[var(--fi-ink)] outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:bg-white/5"
          />
        </div>
        <select
          name="dept"
          defaultValue={dept}
          className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-emerald-400 dark:bg-white/5"
        >
          <option value="">{t('كل الأقسام', 'All Departments')}</option>
          {(departments ?? []).map(d => (
            <option key={d.id} value={d.id}>{d.name_ar ?? d.name}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-emerald-400 dark:bg-white/5"
        >
          <option value="">{t('كل الحالات', 'All Statuses')}</option>
          <option value="active">{t('نشط', 'Active')}</option>
          <option value="inactive">{t('غير نشط', 'Inactive')}</option>
          <option value="terminated">{t('منهي الخدمة', 'Terminated')}</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-[var(--fi-emerald)] px-5 text-sm font-black text-white hover:opacity-90 transition-opacity"
        >
          {t('بحث', 'Search')}
        </button>
        {(q || dept || status) && (
          <Link
            href="/dashboard/erp/hr/employees"
            className="flex h-10 items-center rounded-lg border border-[var(--fi-line)] px-4 text-sm font-bold text-[var(--fi-muted)] hover:bg-[var(--fi-soft)] transition-colors"
          >
            {t('مسح', 'Clear')}
          </Link>
        )}
      </form>

      {/* Employee table */}
      <section className="ds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">{t('الموظف', 'Employee')}</th>
                <th className="px-4 py-3 text-right">{t('القسم / المنصب', 'Dept / Title')}</th>
                <th className="px-4 py-3 text-right">{t('تاريخ التعيين', 'Hire Date')}</th>
                <th className="px-4 py-3 text-right">{t('الراتب', 'Salary')}</th>
                <th className="px-4 py-3 text-right">{t('عمولة %', 'Commission %')}</th>
                <th className="px-4 py-3 text-right">{t('الحالة', 'Status')}</th>
                <th className="px-4 py-3 text-right">{t('البيئة', 'Env')}</th>
                <th className="px-4 py-3 text-right">{t('الملف', 'Profile')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {employees.map(e => (
                <tr key={e.id} className="hover:bg-[var(--fi-soft)]/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-black text-[var(--fi-ink)]">{e.profiles?.full_name ?? t('بدون اسم', 'No name')}</p>
                    <p className="mt-0.5 text-xs text-[var(--fi-muted)]">{e.profiles?.email ?? '—'}</p>
                    <p className="mt-0.5 text-xs font-bold text-indigo-600">{e.employee_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-[var(--fi-ink)]">{e.job_title ?? '—'}</p>
                    <p className="mt-0.5 text-xs text-[var(--fi-muted)]">
                      {e.department_id ? (deptMap[e.department_id] ?? '—') : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[var(--fi-muted)]">
                    {e.hire_date ? new Date(e.hire_date).toLocaleDateString(numLocale) : '—'}
                  </td>
                  <td className="px-4 py-3 font-black text-[var(--fi-ink)]">
                    {fmt.format(Number(e.basic_salary ?? e.base_salary ?? 0))} {t('ج.م', 'EGP')}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">
                    {Number(e.commission_rate ?? 0)}%
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      e.status === 'active'     ? 'bg-emerald-50 text-emerald-700' :
                      e.status === 'terminated' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {e.status === 'active' ? t('نشط', 'Active') : e.status === 'terminated' ? t('منهي', 'Terminated') : e.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      e.is_env_locked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {e.is_env_locked ? t('مربوطة ✓', 'Linked ✓') : t('غير مربوطة', 'Unlinked')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/erp/hr/employees/${e.id}`}
                      className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      {t('الملف', 'Profile')} →
                    </Link>
                  </td>
                </tr>
              ))}
              {!employees.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <Users size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-[var(--fi-muted)]">
                      {q || dept ? t('لا توجد نتائج مطابقة للبحث', 'No matching results') : t('لا يوجد موظفون بعد', 'No employees yet')}
                    </p>
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
