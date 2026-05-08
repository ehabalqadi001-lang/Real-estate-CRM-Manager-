import Link from 'next/link'
import { ExternalLink, Mail, Phone, Users } from 'lucide-react'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type TeamMember = {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
  avatar_url: string | null
}

const ROLE_LABELS: Record<string, string> = {
  marketing_manager:  'مدير التسويق',
  campaign_specialist: 'أخصائي حملات',
  cs_supervisor:      'مشرف خدمة العملاء',
  cs_agent:           'وكيل خدمة العملاء',
}

const ROLE_COLORS: Record<string, string> = {
  marketing_manager:  '#0F8F83',
  campaign_specialist: '#6366f1',
  cs_supervisor:      '#C9964A',
  cs_agent:           '#64748b',
}

const MARKETING_ROLES = ['marketing_manager', 'campaign_specialist', 'cs_supervisor', 'cs_agent']

export default async function MarketingTeamPage() {
  await requirePermission('messages.read')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const { data } = await supabase
    .from('user_profiles')
    .select('id, full_name, phone, role, avatar_url')
    .eq('company_id', companyId)
    .in('role', MARKETING_ROLES)
    .order('role')
    .order('full_name')

  const members = (data ?? []) as TeamMember[]

  const byRole = MARKETING_ROLES.reduce<Record<string, TeamMember[]>>((acc, role) => {
    acc[role] = members.filter((m) => m.role === role)
    return acc
  }, {})

  return (
    <div className="space-y-8 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black text-[#0F8F83]">مركز التسويق</p>
          <h1 className="mt-1 text-xl font-black text-[#102033] sm:text-2xl dark:text-white">فريق التسويق</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {members.length} عضو · مرتبط بنظام HR
          </p>
        </div>
        <Link
          href="/dashboard/erp/hr/employees"
          className="flex items-center gap-2 rounded-xl border border-[#DDE6E4] px-4 py-2 text-sm font-black text-[#0F8F83] transition hover:bg-[#EEF6F5]"
        >
          <ExternalLink className="size-4" />
          إدارة الموظفين في HR
        </Link>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-[#DDE6E4] bg-white p-10 text-center dark:bg-slate-900">
          <Users className="mx-auto mb-3 size-12 text-slate-200" />
          <p className="font-black text-slate-500">لا يوجد موظفون بأدوار تسويقية</p>
          <p className="mt-2 text-sm font-semibold text-slate-400">
            قم بتعيين أدوار تسويقية للموظفين من خلال إدارة HR
          </p>
          <Link
            href="/dashboard/erp/hr/employees"
            className="mt-4 inline-block rounded-xl bg-[#0F8F83] px-5 py-2 text-sm font-black text-white hover:bg-[#0B6F66]"
          >
            إدارة HR ←
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {MARKETING_ROLES.map((role) => {
            const roleMembers = byRole[role] ?? []
            if (roleMembers.length === 0) return null
            const color = ROLE_COLORS[role] ?? '#64748b'
            const label = ROLE_LABELS[role] ?? role
            return (
              <div key={role}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} />
                  <h2 className="font-black text-[#102033] dark:text-white">{label}</h2>
                  <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${color}15`, color }}>
                    {roleMembers.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {roleMembers.map((member) => (
                    <div key={member.id} className="flex items-start gap-3 rounded-2xl border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
                      {/* Avatar */}
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-white font-black text-lg"
                        style={{ backgroundColor: color }}
                      >
                        {(member.full_name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-[#102033] dark:text-white">
                          {member.full_name ?? 'موظف'}
                        </p>
                        <p className="text-xs font-bold" style={{ color }}>{label}</p>
                        {member.phone && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <Phone className="size-3" />
                            <span dir="ltr">{member.phone}</span>
                          </p>
                        )}
                        <Link
                          href={`/dashboard/erp/hr/employees/${member.id}`}
                          className="mt-2 flex items-center gap-1 text-xs font-bold text-[#0F8F83] hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          ملف HR
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info note */}
      <div className="rounded-xl border border-[#C9964A]/30 bg-[#C9964A]/5 p-4">
        <p className="flex items-start gap-2 text-sm font-semibold text-[#C9964A]">
          <Mail className="mt-0.5 size-4 shrink-0" />
          لتعيين موظف لقسم التسويق، قم بتغيير دوره إلى &quot;مدير التسويق&quot; أو &quot;أخصائي حملات&quot; من صفحة{' '}
          <Link href="/dashboard/erp/hr/employees" className="underline hover:no-underline">إدارة الموظفين</Link>
        </p>
      </div>
    </div>
  )
}
