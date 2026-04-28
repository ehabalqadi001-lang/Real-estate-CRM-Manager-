import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerClient } from '@/lib/supabase/server'
import { PointsDashboardClient } from './PointsDashboardClient'

export const dynamic = 'force-dynamic'

export default async function PointsAdminPage() {
  await requirePermission('platform.manage')
  const supabase = await createServerClient()

  const [
    { data: costs },
    { data: paymobSettings },
    { data: wallets },
    { data: userProfiles },
    { data: legacyUsers },
    { data: transactions },
  ] = await Promise.all([
    supabase.from('ad_cost_config').select('*').eq('id', true).maybeSingle(),
    supabase.from('paymob_settings').select('card_integration_id, wallet_integration_id, card_iframe_id, updated_at').eq('id', true).maybeSingle(),
    supabase
      .from('user_wallets')
      .select('id, user_id, points_balance, lifetime_points_earned, lifetime_points_spent, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('user_profiles')
      .select('id, full_name, company_id')
      .order('full_name')
      .limit(200),
    supabase
      .from('profiles')
      .select('id, full_name, email, company_name')
      .order('full_name')
      .limit(200),
    supabase
      .from('wallet_transactions')
      .select('id, user_id, type, points_delta, balance_after, money_amount, currency, reason, created_at, paymob_transaction_id')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const legacyById = new Map<string, any>((legacyUsers ?? []).map((user) => [user.id, user]))
  const users = userProfiles && userProfiles.length > 0
    ? userProfiles.map((user) => {
      const legacy = legacyById.get(user.id)
      return {
        id: String(user.id),
        full_name: String(user.full_name ?? ''),
        email: legacy?.email ? String(legacy.email) : null,
        company_name: legacy?.company_name ? String(legacy.company_name) : (user.company_id ? String(user.company_id) : null),
      }
    })
    : (legacyUsers ?? []).map(u => ({
        id: String(u.id),
        full_name: String(u.full_name ?? ''),
        email: u.email ? String(u.email) : null,
        company_name: u.company_name ? String(u.company_name) : null,
      }))
  
  // Aggregate KPI Stats
  const totalCirculatingPoints = (wallets ?? []).reduce((acc, w) => acc + Number(w.points_balance || 0), 0)
  const totalLifetimeEarned = (wallets ?? []).reduce((acc, w) => acc + Number(w.lifetime_points_earned || 0), 0)
  const recentTopupsEGP = (transactions ?? []).filter(tx => tx.type === 'paymob_topup').reduce((acc, tx) => acc + Number(tx.money_amount || 0), 0)

  // Prepare simplified user payload for Gamification Client Component mapping
  const gamificationUsers = users.map(u => ({ id: u.id, full_name: u.full_name, email: u.email }))

  return (
    <PointsDashboardClient
      costs={costs}
      paymobSettings={paymobSettings}
      wallets={wallets ?? []}
      users={users}
      transactions={transactions ?? []}
      gamificationUsers={gamificationUsers}
      totalCirculatingPoints={totalCirculatingPoints}
      totalLifetimeEarned={totalLifetimeEarned}
      recentTopupsEGP={recentTopupsEGP}
    />
  )
}
