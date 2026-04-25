import { redirect } from 'next/navigation'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { Users, UserCheck, UserX, Building2, Search, AlertCircle } from 'lucide-react'
import { AssignAmForm, RemoveAmForm } from './AssignAmForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'تعيين Account Managers | HR' }

type BrokerRow = {
  profile_id: string
  display_name: string | null
  verification_status: string | null
  account_manager_id: string | null
  full_name: string | null
  am_name: string | null
  am_email: string | null
}

type AccountManagerOption = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

export default async function HrAssignManagersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await requireSession()

  if (!hasPermission(session.profile.role, 'broker.assign_manager')) {
    redirect('/dashboard')
  }

  const service = createServiceRoleClient()
  const sp = (await searchParams) as Record<string, string>
  const filterAm = sp.am ?? ''
  const filterStatus = sp.status ?? ''
  const filterSearch = sp.search ?? ''

  // Fetch brokers with their AM assignments (exclude orphan rows with null profile_id)
  let bpQuery = service
    .from('broker_profiles')
    .select('profile_id, display_name, verification_status, account_manager_id')
    .not('profile_id', 'is', null)
    .order('display_name')

  if (filterStatus) bpQuery = bpQuery.eq('verification_status', filterStatus)
  if (filterAm === '__none__') bpQuery = bpQuery.is('account_manager_id', null)
  else if (filterAm) bpQuery = bpQuery.eq('account_manager_id', filterAm)
  // DB-side search on display_name (avoids JS-only filtering of first 200 rows)
  if (filterSearch) bpQuery = bpQuery.ilike('display_name', `%${filterSearch}%`)

  const [{ data: brokerProfiles }, { data: accountManagers }, { data: allProfiles }] = await Promise.all([
    bpQuery.limit(1000),
    service
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['account_manager', 'users_am', 'am_supervisor', 'company_admin', 'branch_manager'])
      .order('full_name'),
    service
      .from('profiles')
      .select('id, full_name, email')
      .limit(2000),
  ])

  // Build lookup maps
  const profileById = new Map((allProfiles ?? []).map((p) => [p.id, p]))
  const amById = new Map((accountManagers ?? []).map((m) => [m.id, m]))

  const brokers: BrokerRow[] = (brokerProfiles ?? []).map((bp) => {
    const profile = profileById.get(bp.profile_id)
    const am = bp.account_manager_id ? amById.get(bp.account_manager_id) ?? profileById.get(bp.account_manager_id) : null
    return {
      profile_id: bp.profile_id,
      display_name: bp.display_name ?? profile?.full_name ?? null,
      verification_status: bp.verification_status,
      account_manager_id: bp.account_manager_id,
      full_name: profile?.full_name ?? null,
      am_name: am?.full_name ?? null,
      am_email: am?.email ?? null,
    }
  })

  const amOptions = (accountManagers ?? []) as AccountManagerOption[]
  const unassigned = brokers.filter((b) => !b.account_manager_id).length
  const assigned = brokers.filter((b) => b.account_manager_id).length

  // Stats per AM
  const amStats = new Map<string, number>()
  for (const b of brokerProfiles ?? []) {
    if (b.account_manager_id) amStats.set(b.account_manager_id, (amStats.get(b.account_manager_id) ?? 0) + 1)
  }

  const verificationColors: Record<string, string> = {
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    under_review: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
  }
  const verificationLabels: Record<string, string> = {
    verified: 'معتمد',
    pending: 'قيد الانتظار',
    under_review: 'تحت المراجعة',
    rejected: 'مرفوض',
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="rounded-2xl border border-[var(--fi-line)] bg-white p-5 shadow-sm dark:bg-gray-900">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fi-emerald)]">HR PORTAL</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] dark:text-white">تعيين Account Managers للشركاء</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
          قسم الـ HR يتحكم في تعيين مدير الحساب المسؤول عن كل شريك.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Users} label="إجمالي الشركاء" value={String(brokerProfiles?.length ?? 0)} color="text-blue-600" bg="bg-blue-50" />
        <KpiCard icon={UserCheck} label="شركاء لديهم AM" value={String(assigned)} color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard icon={UserX} label="شركاء بدون AM" value={String(unassigned)} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* AM Load Distribution */}
      {amOptions.length > 0 && (
        <div className="rounded-2xl border border-[var(--fi-line)] bg-white p-5 shadow-sm dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="size-4 text-[var(--fi-emerald)]" />
            <h2 className="font-black text-[var(--fi-ink)] dark:text-white">توزيع الشركاء على مديري الحسابات</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {amOptions.map((am) => {
              const count = amStats.get(am.id) ?? 0
              return (
                <div key={am.id} className="flex items-center justify-between rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[var(--fi-ink)] dark:text-white">{am.full_name ?? am.email}</p>
                    <p className="truncate text-xs font-semibold text-[var(--fi-muted)]">{am.role}</p>
                  </div>
                  <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${count > 0 ? 'bg-[var(--fi-emerald)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count} شريك
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <form action="/dashboard/hr/assign-managers" className="rounded-2xl border border-[var(--fi-line)] bg-white p-4 shadow-sm dark:bg-gray-900">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-1">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" />
            <input
              name="search"
              defaultValue={filterSearch}
              placeholder="بحث بالاسم…"
              className="h-10 w-full rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] pr-9 pl-3 text-sm font-semibold outline-none focus:border-[var(--fi-emerald)]"
            />
          </div>
          <select name="status" defaultValue={filterStatus} className="h-10 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 text-sm font-semibold outline-none focus:border-[var(--fi-emerald)]">
            <option value="">كل الحالات</option>
            <option value="verified">معتمد</option>
            <option value="pending">قيد الانتظار</option>
            <option value="under_review">تحت المراجعة</option>
            <option value="rejected">مرفوض</option>
          </select>
          <select name="am" defaultValue={filterAm} className="h-10 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 text-sm font-semibold outline-none focus:border-[var(--fi-emerald)]">
            <option value="">كل مديري الحسابات</option>
            <option value="__none__">بدون AM</option>
            {amOptions.map((am) => (
              <option key={am.id} value={am.id}>{am.full_name ?? am.email}</option>
            ))}
          </select>
          <button className="h-10 rounded-xl bg-[var(--fi-emerald)] px-4 text-sm font-black text-white hover:opacity-90">
            فلترة
          </button>
        </div>
      </form>

      {/* Brokers Table */}
      <div className="rounded-2xl border border-[var(--fi-line)] bg-white shadow-sm dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--fi-line)] px-5 py-4">
          <h2 className="font-black text-[var(--fi-ink)] dark:text-white">قائمة الشركاء</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--fi-soft)] px-3 py-1 text-xs font-black text-[var(--fi-emerald)]">
              {brokers.length} شريك
            </span>
            {brokers.length === 1000 && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                يُعرض أول 1000 — استخدم الفلاتر للتضييق
              </span>
            )}
          </div>
        </div>

        {brokers.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <AlertCircle className="mb-3 size-10 text-gray-200" />
            <p className="text-sm font-bold text-[var(--fi-muted)]">لا يوجد شركاء مطابقون للفلاتر الحالية</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--fi-line)]">
            {brokers.map((broker) => (
              <article key={broker.profile_id} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto]">
                {/* Broker Info */}
                <div className="min-w-0 flex flex-wrap items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
                    <Users className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[var(--fi-ink)] dark:text-white">
                        {broker.display_name ?? broker.full_name ?? broker.profile_id?.slice(0, 8) ?? '—'}
                      </p>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${verificationColors[broker.verification_status ?? 'pending'] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {verificationLabels[broker.verification_status ?? 'pending'] ?? broker.verification_status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--fi-muted)]">ID: {broker.profile_id?.slice(0, 8) ?? '—'}…</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {broker.account_manager_id ? (
                        <>
                          <UserCheck className="size-3.5 text-[var(--fi-emerald)]" />
                          <span className="text-xs font-black text-[var(--fi-emerald)]">
                            AM: {broker.am_name ?? broker.am_email ?? 'غير معروف'}
                          </span>
                        </>
                      ) : (
                        <>
                          <UserX className="size-3.5 text-amber-500" />
                          <span className="text-xs font-black text-amber-600">لا يوجد Account Manager</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assignment Form */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-stretch min-w-[280px]">
                  <AssignAmForm
                    brokerProfileId={broker.profile_id}
                    currentAmId={broker.account_manager_id}
                    amOptions={amOptions}
                  />
                  {broker.account_manager_id && (
                    <RemoveAmForm brokerProfileId={broker.profile_id} />
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: React.ElementType; label: string; value: string; color: string; bg: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--fi-line)] bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className={`inline-flex size-9 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`size-5 ${color}`} />
      </div>
      <p className="mt-3 text-2xl font-black text-[var(--fi-ink)] dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}
