import { TeamManagementClient, type TeamMemberRow } from '@/components/team/TeamManagementClient'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()
  const companyId = session.profile.company_id ?? session.user.id

  let profileQuery = supabase
    .from('profiles')
    .select('id, full_name, email, role, status, is_active, company_id')
    .in('role', ['branch_manager', 'senior_agent', 'agent', 'broker', 'individual', 'viewer'])
    .limit(300)

  if (companyId) profileQuery = profileQuery.eq('company_id', companyId)
  const { data: profiles } = await profileQuery
  const ids = (profiles ?? []).map((profile) => profile.id)

  const [dealsResult, commissionsResult] = await Promise.all([
    ids.length ? supabase.from('deals').select('id, agent_id, stage, unit_value, value, amount, final_price, created_at').in('agent_id', ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from('commissions').select('id, agent_id, amount, agent_amount, status, created_at').in('agent_id', ids) : Promise.resolve({ data: [] }),
  ])

  const deals = (dealsResult.data ?? []) as Array<Record<string, unknown>>
  const commissions = (commissionsResult.data ?? []) as Array<Record<string, unknown>>
  const now = new Date()

  const members: TeamMemberRow[] = (profiles ?? []).map((profile) => {
    const memberDeals = deals.filter((deal) => deal.agent_id === profile.id)
    const monthDeals = memberDeals.filter((deal) => {
      const date = new Date(String(deal.created_at))
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    const memberCommissions = commissions.filter((commission) => commission.agent_id === profile.id)
    return {
      id: profile.id,
      name: profile.full_name ?? 'عضو فريق',
      email: profile.email ?? null,
      role: profile.role ?? 'agent',
      activeDeals: memberDeals.filter((deal) => !['closed', 'closed_won', 'lost', 'closed_lost'].includes(String(deal.stage))).length,
      monthSales: monthDeals.reduce((sum, deal) => sum + Number(deal.final_price ?? deal.unit_value ?? deal.value ?? deal.amount ?? 0), 0),
      commissions: memberCommissions.reduce((sum, commission) => sum + Number(commission.agent_amount ?? commission.amount ?? 0), 0),
      status: profile.is_active === false || profile.status === 'suspended' ? 'suspended' : 'active',
      sparkline: buildSparkline(memberDeals),
    }
  })

  return (
    <main className="px-3 py-4 sm:px-4 lg:px-6" dir="rtl">
      <TeamManagementClient members={members} />
    </main>
  )
}

function buildSparkline(deals: Array<Record<string, unknown>>) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index - 5, 1)
    return {
      label: date.toLocaleDateString('ar-EG', { month: 'short' }),
      value: deals
        .filter((deal) => {
          const created = new Date(String(deal.created_at))
          return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear()
        })
        .reduce((sum, deal) => sum + Number(deal.final_price ?? deal.unit_value ?? deal.value ?? deal.amount ?? 0), 0),
    }
  })
}
