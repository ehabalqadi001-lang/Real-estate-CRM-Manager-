import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { AssetsClient } from './AssetsClient'

export const dynamic = 'force-dynamic'

type CreativeAsset = {
  id: string
  asset_type: string
  output_text: string | null
  provider: string | null
  status: string | null
  created_at: string | null
  metadata: Record<string, unknown> | null
}

export default async function MarketingAssetsPage() {
  await requirePermission('messages.read')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const { data } = await supabase
    .from('creative_assets')
    .select('id, asset_type, output_text, provider, status, created_at, metadata')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(100)

  const assets = (data ?? []) as CreativeAsset[]
  return <AssetsClient assets={assets} />
}
