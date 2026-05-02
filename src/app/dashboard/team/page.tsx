import { TeamManagementClient, type TeamMemberRow } from '@/components/team/TeamManagementClient'
import { getI18n } from '@/lib/i18n'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { normalizeRole } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const { t, numLocale } = await getI18n()
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()
  const companyId = session.profile.company_id ?? session.user.id

  const profiles = await getTeamProfiles(supabase, companyId)
  const ids = profiles.map((profile) => profile.id)

  const [dealsResult, commissionsResult] = await Promise.all([
    ids.length ? supabase.from('deals').select('id, agent_id, stage, unit_value, value, amount, final_price, created_at').in('agent_id', ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from('commissions').select('id, agent_id, amount, agent_amount, status, created_at').in('agent_id', ids) : Promise.resolve({ data: [] }),
  ])

  const deals = (dealsResult.data ?? []) as Array<Record<string, unknown>>
  const commissions = (commissionsResult.data ?? []) as Array<Record<string, unknown>>
  const now = new Date()

  const members: TeamMemberRow[] = profiles.map((profile) => {
    const memberDeals = deals.filter((deal) => deal.agent_id === profile.id)
    const monthDeals = memberDeals.filter((deal) => {
      const date = new Date(String(deal.created_at))
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    const memberCommissions = commissions.filter((commission) => commission.agent_id === profile.id)
    return {
      id: profile.id,
      name: profile.full_name ?? t('عضو فريق', 'Team Member'),
      email: profile.email,
      role: profile.role ?? 'agent',
      activeDeals: memberDeals.filter((deal) => !['closed', 'closed_won', 'lost', 'closed_lost'].includes(String(deal.stage))).length,
      monthSales: monthDeals.reduce((sum, deal) => sum + Number(deal.final_price ?? deal.unit_value ?? deal.value ?? deal.amount ?? 0), 0),
      commissions: memberCommissions.reduce((sum, commission) => sum + Number(commission.agent_amount ?? commission.amount ?? 0), 0),
      status: profile.status === 'suspended' || profile.status === 'rejected' ? 'suspended' : 'active',
      sparkline: buildSparkline(memberDeals, numLocale),
    }
  })

  return (
    <main className="px-3 py-4 sm:px-4 lg:px-6">
      <TeamManagementClient members={members} currentRole={normalizeRole(session.profile.role)} />
    </main>
  )
}

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>

type TeamProfile = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  status: string | null
  company_id: string | null
}

async function getTeamProfiles(supabase: ServerSupabase, companyId: string | null): Promise<TeamProfile[]> {
  let userProfilesQuery = supabase
    .from('user_profiles')
    .select('id, full_name, role, status, company_id')
    .in('role', ['company_owner', 'company_admin', 'branch_manager', 'senior_agent', 'agent', 'broker', 'individual', 'viewer'])
    .limit(300)

  if (companyId) userProfilesQuery = userProfilesQuery.eq('company_id', companyId)
  const { data: userProfiles, error } = await userProfilesQuery

  if (!error && userProfiles && userProfiles.length > 0) {
    return userProfiles.map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      email: null,
      role: profile.role,
      status: profile.status,
      company_id: profile.company_id,
    }))
  }

  let legacyQuery = supabase
    .from('profiles')
    .select('id, full_name, email, role, status, company_id')
    .in('role', ['company_owner', 'company_admin', 'branch_manager', 'senior_agent', 'agent', 'broker', 'individual', 'viewer'])
    .limit(300)

  if (companyId) legacyQuery = legacyQuery.eq('company_id', companyId)
  const { data: legacyProfiles } = await legacyQuery

  return (legacyProfiles ?? []).map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email ?? null,
    role: profile.role,
    status: profile.status,
    company_id: profile.company_id,
  }))
}

function buildSparkline(deals: Array<Record<string, unknown>>, numLocale: string) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index - 5, 1)
    return {
      label: date.toLocaleDateString(numLocale, { month: 'short' }),
      value: deals
        .filter((deal) => {
          const created = new Date(String(deal.created_at))
          return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear()
        })
        .reduce((sum, deal) => sum + Number(deal.final_price ?? deal.unit_value ?? deal.value ?? deal.amount ?? 0), 0),
    }
  })
}
