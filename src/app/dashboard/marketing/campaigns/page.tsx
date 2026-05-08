import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { CampaignsClient } from './CampaignsClient'

export const dynamic = 'force-dynamic'

type Campaign = {
  id: string
  name: string
  department: string
  status: string
  budget_egp: number | null
  start_date: string | null
  end_date: string | null
  goals: string | null
  created_at: string
}

export default async function MarketingCampaignsPage() {
  await requirePermission('messages.read')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const { data } = await supabase
    .from('marketing_campaigns')
    .select('id, name, department, status, budget_egp, start_date, end_date, goals, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const campaigns = (data ?? []) as Campaign[]
  return <CampaignsClient campaigns={campaigns} companyId={companyId} userId={user.id} />
}
