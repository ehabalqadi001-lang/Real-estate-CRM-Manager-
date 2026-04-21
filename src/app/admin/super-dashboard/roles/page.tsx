import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Users, ShieldCheck } from 'lucide-react'
import { RoleAssignForm } from './RoleAssignForm'

export const dynamic = 'force-dynamic'

const ROLE_COLOR: Record<string, string> = {
  super_admin:        'bg-[#C9964A]/20 text-[#C9964A]',
  finance_manager:    'bg-emerald-100 text-emerald-700',
  ad_manager:         'bg-blue-100 text-blue-700',
  ad_reviewer:        'bg-sky-100 text-sky-700',
  data_manager:       'bg-purple-100 text-purple-700',
  inventory_rep:      'bg-violet-100 text-violet-700',
  am_supervisor:      'bg-indigo-100 text-indigo-700',
  users_am:           'bg-indigo-50 text-indigo-600',
  ads_am:             'bg-cyan-100 text-cyan-700',
  collection_rep:     'bg-teal-100 text-teal-700',
  cs_supervisor:      'bg-pink-100 text-pink-700',
  cs_agent:           'bg-rose-100 text-rose-600',
  marketing_manager:  'bg-orange-100 text-orange-700',
  campaign_specialist:'bg-amber-100 text-amber-700',
}

export default async function RoleAssignmentPage() {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()

  const [{ data: userProfiles }, { data: legacyProfiles }, { data: fiRoles }] = await Promise.all([
    supabase.from('user_profiles').select('id, full_name, role').order('full_name'),
    supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
    supabase.from('roles').select('id, name, slug, department_id, departments(name)').order('name'),
  ])
  const emailById = new Map((legacyProfiles ?? []).map((profile) => [profile.id, profile.email ?? null]))
  const profiles = userProfiles && userProfiles.length > 0
    ? userProfiles.map((profile) => ({ ...profile, email: emailById.get(profile.id) ?? null }))
    : legacyProfiles ?? []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[#0F8F83]">Super Admin</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-black text-[#102033] dark:text-white">
          <ShieldCheck className="size-8 text-[#C9964A]" />
          تعيين الأدوار الوظيفية
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          عيّن أدوار Fast Investment لكل مستخدم. يمكن تعيين أدوار متعددة لنفس المستخدم.
        </p>
      </div>

      {/* User list with role assignment */}
      <div className="overflow-hidden rounded-xl border border-[#DDE6E4] bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-[#DDE6E4] px-5 py-4">
          <Users className="size-4 text-[#0F8F83]" />
          <p className="font-black text-[#102033] dark:text-white">المستخدمون</p>
          <Badge className="bg-[#EEF6F5] text-[#0F8F83]">{profiles?.length ?? 0}</Badge>
        </div>

        <div className="divide-y divide-[#DDE6E4]">
          {(profiles ?? []).map((profile) => (
            <div key={profile.id} className="grid items-center gap-4 px-5 py-4 md:grid-cols-[200px_1fr_240px]">
              <div>
                <p className="font-black text-[#102033] dark:text-white">{profile.full_name ?? 'بدون اسم'}</p>
                <p className="truncate text-xs font-semibold text-slate-500">{profile.email ?? '—'}</p>
              </div>
              <Badge className={`w-fit text-xs ${ROLE_COLOR[profile.role ?? ''] ?? 'bg-slate-100 text-slate-500'}`}>
                {profile.role ?? 'viewer'}
              </Badge>
              <RoleAssignForm
                userId={profile.id}
                currentRole={profile.role ?? 'viewer'}
                roles={(fiRoles ?? []).map((r) => ({ id: r.id, name: r.name, slug: r.slug, departments: Array.isArray(r.departments) ? (r.departments[0] ?? null) : (r.departments as { name: string } | null) }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
