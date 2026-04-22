import { redirect } from 'next/navigation'
import { Building2, ShieldCheck, UserCog, Users } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { DeveloperAccountForm } from './DeveloperAccountForm'
import { SuspendDeveloperAccountButton } from './SuspendDeveloperAccountButton'

export const dynamic = 'force-dynamic'

type DeveloperAccountRow = {
  id: string
  user_id: string
  developer_id: string
  role: string
  status: string
  created_at: string
}

export default async function DeveloperAccountsPage() {
  const session = await requireSession()
  if (!hasPermission(session.profile.role, 'developer.manage')) redirect('/dashboard')

  const supabase = createServiceRoleClient()
  const [accountsResult, developersResult, usersResult] = await Promise.all([
    supabase
      .from('developer_accounts')
      .select('id, user_id, developer_id, role, status, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('developers').select('id, name, name_ar').eq('active', true).order('name_ar'),
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name')
      .limit(500),
  ])

  const rawAccounts = (accountsResult.data ?? []) as DeveloperAccountRow[]
  const developers = developersResult.data ?? []
  const users = usersResult.data ?? []
  const developerById = new Map(developers.map((developer) => [developer.id, developer]))
  const userById = new Map(users.map((user) => [user.id, user]))
  const accounts = rawAccounts.map((account) => ({
    ...account,
    developers: developerById.get(account.developer_id) ?? null,
    profiles: userById.get(account.user_id) ?? null,
  }))
  const activeAccounts = accounts.filter((account) => account.status === 'active').length
  const pageError = accountsResult.error || developersResult.error || usersResult.error

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">DEVELOPER ACCESS CONTROL</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">صلاحيات بوابة المطور</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          ربط مستخدمي المطورين بالمشاريع والمخزون دون كشف بيانات CRM الداخلية.
        </p>
      </section>

      {pageError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          تعذر تحميل حسابات المطورين: {pageError.message}
        </section>
      ) : null}

      <BentoGrid>
        <BentoKpiCard title="حسابات المطورين" value={<AnimatedCount value={accounts.length} />} hint="كل الحالات" icon={<UserCog className="size-5" />} />
        <BentoKpiCard title="حسابات نشطة" value={<AnimatedCount value={activeAccounts} />} hint="تستطيع الدخول" icon={<ShieldCheck className="size-5" />} />
        <BentoKpiCard title="المطورون" value={<AnimatedCount value={developers.length} />} hint="نشطون" icon={<Building2 className="size-5" />} />
        <BentoKpiCard title="مستخدمون متاحون" value={<AnimatedCount value={users.length} />} hint="قابلون للربط" icon={<Users className="size-5" />} />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <DeveloperAccountForm developers={developers} users={users} />
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">الحسابات المرتبطة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">المستخدم</th>
                  <th className="px-4 py-3 text-right">المطور</th>
                  <th className="px-4 py-3 text-right">الدور</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-4 py-3">
                      <p className="font-black text-[var(--fi-ink)]">{account.profiles?.full_name ?? 'بدون اسم'}</p>
                      <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">{account.profiles?.email ?? 'بدون بريد'}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">
                      {account.developers?.name_ar ?? account.developers?.name ?? 'مطور غير محدد'}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{labelDeveloperRole(account.role)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${account.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {account.status === 'active' ? 'نشط' : 'معلق'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {account.status === 'active' ? <SuspendDeveloperAccountButton accountId={account.id} /> : null}
                    </td>
                  </tr>
                ))}
                {!accounts.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm font-bold text-[var(--fi-muted)]">
                      لا توجد حسابات مطورين مرتبطة حتى الآن.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function labelDeveloperRole(role: string) {
  const labels: Record<string, string> = {
    developer_admin: 'مدير المطور',
    developer_sales: 'مبيعات المطور',
    developer_manager: 'مدير مبيعات المطور',
    content_manager: 'مسؤول محتوى',
    viewer: 'مشاهد',
  }

  return labels[role] ?? role
}
