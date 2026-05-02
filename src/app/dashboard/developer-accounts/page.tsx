import { getI18n } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import { Building2, ShieldCheck, UserCog, Users } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { DeveloperAccountForm } from './DeveloperAccountForm'
import { DeveloperProjectAccessForm } from './DeveloperProjectAccessForm'
import { RevokeDeveloperProjectAccessButton } from './RevokeDeveloperProjectAccessButton'
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

type ProjectAccessRow = {
  id: string
  developer_account_id: string
  project_id: string
  can_view_leads: boolean
  can_manage_inventory: boolean
  can_manage_media: boolean
  can_manage_meetings: boolean
}

export default async function DeveloperAccountsPage() {
  const { dir } = await getI18n()
  const session = await requireSession()
  if (!hasPermission(session.profile.role, 'developer.manage')) redirect('/dashboard')

  const supabase = createServiceRoleClient()
  const [accountsResult, developersResult, usersResult, projectsResult, accessResult] = await Promise.all([
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
    supabase.from('projects').select('id, developer_id, name, name_ar').order('name_ar').limit(500),
    supabase
      .from('developer_projects_access')
      .select('id, developer_account_id, project_id, can_view_leads, can_manage_inventory, can_manage_media, can_manage_meetings')
      .order('created_at', { ascending: false }),
  ])

  const rawAccounts = (accountsResult.data ?? []) as DeveloperAccountRow[]
  const developers = developersResult.data ?? []
  const users = usersResult.data ?? []
  const projects = projectsResult.data ?? []
  const accessRows = (accessResult.data ?? []) as ProjectAccessRow[]
  const developerById = new Map(developers.map((developer) => [developer.id, developer]))
  const userById = new Map(users.map((user) => [user.id, user]))
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const accounts = rawAccounts.map((account) => ({
    ...account,
    developers: developerById.get(account.developer_id) ?? null,
    profiles: userById.get(account.user_id) ?? null,
  }))
  const accountById = new Map(accounts.map((account) => [account.id, account]))
  const accountOptions = accounts.map((account) => ({
    id: account.id,
    developer_id: account.developer_id,
    label: `${account.profiles?.full_name ?? 'بدون اسم'} · ${account.developers?.name_ar ?? account.developers?.name ?? 'مطور'}`,
  }))
  const activeAccounts = accounts.filter((account) => account.status === 'active').length
  const pageError = accountsResult.error || developersResult.error || usersResult.error || projectsResult.error || accessResult.error

  return (
    <main className="space-y-6 p-4 sm:p-6">
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
        <div className="space-y-6">
          <DeveloperAccountForm developers={developers} users={users} />
          <DeveloperProjectAccessForm accounts={accountOptions} projects={projects} />
        </div>
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

      <section className="ds-card overflow-hidden">
        <div className="border-b border-[var(--fi-line)] p-5">
          <h2 className="text-xl font-black text-[var(--fi-ink)]">صلاحيات المشاريع</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">كل حساب مطور يمكن حصره في مشروع أو أكثر مع صلاحيات مستقلة.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">الحساب</th>
                <th className="px-4 py-3 text-right">المشروع</th>
                <th className="px-4 py-3 text-right">العملاء</th>
                <th className="px-4 py-3 text-right">المخزون</th>
                <th className="px-4 py-3 text-right">الميديا</th>
                <th className="px-4 py-3 text-right">الاجتماعات</th>
                <th className="px-4 py-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {accessRows.map((access) => {
                const account = accountById.get(access.developer_account_id)
                const project = projectById.get(access.project_id)
                return (
                  <tr key={access.id}>
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{account?.profiles?.full_name ?? 'حساب غير معروف'}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{project?.name_ar ?? project?.name ?? 'مشروع غير معروف'}</td>
                    <td className="px-4 py-3">{flag(access.can_view_leads)}</td>
                    <td className="px-4 py-3">{flag(access.can_manage_inventory)}</td>
                    <td className="px-4 py-3">{flag(access.can_manage_media)}</td>
                    <td className="px-4 py-3">{flag(access.can_manage_meetings)}</td>
                    <td className="px-4 py-3"><RevokeDeveloperProjectAccessButton accessId={access.id} /></td>
                  </tr>
                )
              })}
              {!accessRows.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-[var(--fi-muted)]">
                    لا توجد صلاحيات مشاريع مخصصة حتى الآن.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function flag(value: boolean) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
      {value ? 'مسموح' : 'مغلق'}
    </span>
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
