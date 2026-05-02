import { getI18n } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarOff, Clock, CheckCircle2, Users } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { ApproveLeaveButton, RejectLeaveButton } from './LeaveControls'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

type LeaveRequest = {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_count: number
  reason: string | null
  status: string
  manager_notes: string | null
  decided_at: string | null
  created_at: string
  profiles: { full_name: string | null } | null
  leave_types: { name_ar: string | null; is_paid: boolean | null } | null
}

const statusBadge: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  approved:  'bg-emerald-50 text-emerald-700',
  rejected:  'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
}
const statusLabel: Record<string, string> = {
  pending:   'قيد المراجعة',
  approved:  'مُقرَّرة',
  rejected:  'مرفوضة',
  cancelled: 'ملغاة',
}

const dateFormatter = new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' })

export default async function LeavesPage() {
  const { dir } = await getI18n()
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  let requestsQuery = supabase
    .from('leave_requests')
    .select(`
      id, employee_id, leave_type_id, start_date, end_date,
      days_count, reason, status, manager_notes, decided_at, created_at,
      profiles!leave_requests_employee_id_fkey(full_name),
      leave_types!leave_requests_leave_type_id_fkey(name_ar, is_paid)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (companyId) requestsQuery = requestsQuery.eq('company_id', companyId)

  let typesQuery = supabase
    .from('leave_types')
    .select('id, name, name_ar, days_per_year, is_paid')
    .eq('is_active', true)

  if (companyId) typesQuery = typesQuery.or(`company_id.eq.${companyId},company_id.is.null`)

  let employeesQuery = supabase
    .from('employees')
    .select('id, profiles!employees_id_fkey(full_name)')
    .eq('status', 'active')

  if (companyId) employeesQuery = employeesQuery.eq('company_id', companyId)

  const [requestsResult, typesResult, empResult] = await Promise.all([
    requestsQuery,
    typesQuery,
    employeesQuery,
  ])

  const requests = ((requestsResult.data ?? []) as unknown as LeaveRequest[]).map((r) => ({
    ...r,
    profiles: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
    leave_types: Array.isArray(r.leave_types) ? r.leave_types[0] : r.leave_types,
  }))

  const leaveTypes = (typesResult.data ?? []) as { id: string; name: string; name_ar: string | null; days_per_year: number; is_paid: boolean }[]

  const employees = ((empResult.data ?? []) as unknown as Array<{
    id: string
    profiles: { full_name: string | null } | { full_name: string | null }[] | null
  }>).map((e) => ({
    id: e.id,
    name: (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles)?.full_name ?? 'موظف',
  }))

  const canWrite = HR_WRITE_ROLES.includes(profile.role)

  const pendingCount   = requests.filter((r) => r.status === 'pending').length
  const approvedCount  = requests.filter((r) => r.status === 'approved').length
  const totalDays      = requests.filter((r) => r.status === 'approved').reduce((s, r) => s + Number(r.days_count), 0)

  // Group pending requests by type for the overview
  const byType = leaveTypes.map((lt) => ({
    ...lt,
    pendingCount: requests.filter((r) => r.leave_type_id === lt.id && r.status === 'pending').length,
    approvedCount: requests.filter((r) => r.leave_type_id === lt.id && r.status === 'approved').length,
  }))

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section className="ds-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">LEAVE MANAGEMENT</p>
            <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">إدارة الإجازات</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
              طلبات الإجازة — الموافقة والرفض — رصيد الموظفين.
            </p>
          </div>
          {canWrite && (
            <Link
              href="/dashboard/employee"
              className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-4 text-sm font-black text-[var(--fi-ink)] transition hover:border-[var(--fi-emerald)] dark:bg-white/5"
            >
              تقديم طلب إجازة
            </Link>
          )}
        </div>
      </section>

      <BentoGrid>
        <BentoKpiCard
          title="طلبات قيد المراجعة"
          value={<AnimatedCount value={pendingCount} />}
          hint="بانتظار القرار"
          icon={<Clock className="size-5" />}
        />
        <BentoKpiCard
          title="إجازات مُقرَّرة"
          value={<AnimatedCount value={approvedCount} />}
          hint="هذا العام"
          icon={<CheckCircle2 className="size-5" />}
        />
        <BentoKpiCard
          title="إجمالي أيام الإجازات"
          value={<AnimatedCount value={totalDays} />}
          hint="مُقرَّرة"
          icon={<CalendarOff className="size-5" />}
        />
        <BentoKpiCard
          title="أنواع الإجازات"
          value={<AnimatedCount value={leaveTypes.length} />}
          hint="متاحة"
          icon={<Users className="size-5" />}
        />
      </BentoGrid>

      {/* Leave type summary */}
      {byType.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">ملخص أنواع الإجازات</h2>
          </div>
          <div className="grid gap-0 divide-y divide-[var(--fi-line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse lg:grid-cols-4 lg:divide-y-0">
            {byType.map((lt) => (
              <div key={lt.id} className="p-4">
                <p className="text-sm font-black text-[var(--fi-ink)]">{lt.name_ar ?? lt.name}</p>
                <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">{lt.days_per_year} يوم/سنة — {lt.is_paid ? 'براتب' : 'بدون راتب'}</p>
                <div className="mt-3 flex gap-3">
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">{lt.pendingCount} انتظار</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">{lt.approvedCount} مُقرَّرة</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending requests — top priority */}
      {pendingCount > 0 && (
        <section className="ds-card overflow-hidden border-2 border-amber-200">
          <div className="border-b border-amber-200 bg-amber-50 p-5">
            <h2 className="text-xl font-black text-amber-800">
              طلبات تنتظر موافقتك ({pendingCount})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">الموظف</th>
                  <th className="px-4 py-3 text-right">نوع الإجازة</th>
                  <th className="px-4 py-3 text-right">من</th>
                  <th className="px-4 py-3 text-right">إلى</th>
                  <th className="px-4 py-3 text-right">أيام</th>
                  <th className="px-4 py-3 text-right">السبب</th>
                  {canWrite && <th className="px-4 py-3 text-right">إجراء</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {requests
                  .filter((r) => r.status === 'pending')
                  .map((r) => (
                    <tr key={r.id} className="transition hover:bg-amber-50/40">
                      <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{r.profiles?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">
                        {r.leave_types?.name_ar ?? '—'}
                        {r.leave_types?.is_paid === false && (
                          <span className="mr-1 text-xs text-red-500">(بدون راتب)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{dateFormatter.format(new Date(r.start_date))}</td>
                      <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{dateFormatter.format(new Date(r.end_date))}</td>
                      <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{r.days_count}</td>
                      <td className="px-4 py-3 text-[var(--fi-muted)] max-w-[200px] truncate">{r.reason ?? '—'}</td>
                      {canWrite && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <ApproveLeaveButton requestId={r.id} />
                            <RejectLeaveButton requestId={r.id} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* All requests */}
      <section className="ds-card overflow-hidden">
        <div className="border-b border-[var(--fi-line)] p-5">
          <h2 className="text-xl font-black text-[var(--fi-ink)]">سجل طلبات الإجازة</h2>
          <p className="mt-1 text-sm font-bold text-[var(--fi-muted)]">{requests.length} طلب</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">الموظف</th>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">الفترة</th>
                <th className="px-4 py-3 text-right">أيام</th>
                <th className="px-4 py-3 text-right">تاريخ الطلب</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">ملاحظات HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {requests.map((r) => (
                <tr key={r.id} className="transition hover:bg-[var(--fi-soft)]/60">
                  <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{r.profiles?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{r.leave_types?.name_ar ?? '—'}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">
                    {dateFormatter.format(new Date(r.start_date))} — {dateFormatter.format(new Date(r.end_date))}
                  </td>
                  <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{r.days_count}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">
                    {new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short' }).format(new Date(r.created_at))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadge[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--fi-muted)]">{r.manager_notes ?? '—'}</td>
                </tr>
              ))}
              {!requests.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm font-bold text-[var(--fi-muted)]">
                    لا توجد طلبات إجازة حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leave types reference card */}
      {!leaveTypes.length && (
        <section className="ds-card border-2 border-dashed border-[var(--fi-line)] p-4 sm:p-8 text-center">
          <CalendarOff className="mx-auto mb-3 size-10 text-[var(--fi-muted)]" />
          <p className="font-black text-[var(--fi-ink)]">لا توجد أنواع إجازات مُعرَّفة</p>
          <p className="mt-1 text-sm font-bold text-[var(--fi-muted)]">
            أضف أنواع الإجازات (سنوية، مرضية، طارئة) من إعدادات الشركة، أو تواصل مع مدير المنصة.
          </p>
        </section>
      )}
    </main>
  )
}
