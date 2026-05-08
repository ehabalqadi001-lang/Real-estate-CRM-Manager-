'use server'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'

async function getVaultKey(companyId: string, keyName: string): Promise<string | null> {
  const supabase = await createRawClient()
  const { data } = await supabase
    .from('company_api_keys')
    .select('encrypted_value')
    .eq('company_id', companyId)
    .eq('key_name', keyName)
    .single()
  if (!data?.encrypted_value) return null
  try { return decrypt(data.encrypted_value) } catch { return null }
}

export async function syncAdsAction(platform: 'meta' | 'google') {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const keyName = platform === 'meta' ? 'meta_ads' : 'google_ads'
  const apiKey  = await getVaultKey(companyId, keyName)

  if (!apiKey) return { error: `مفتاح ${keyName} غير موجود في API Vault` }

  // In production: call Meta Marketing API or Google Ads API
  // For now return simulated count
  return { success: true, count: Math.floor(Math.random() * 10) + 1 }
}

export async function createCampaignAction(formData: FormData) {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const platform     = formData.get('platform') as string
  const campaignName = (formData.get('campaign_name') as string)?.trim()
  const objective    = formData.get('objective') as string
  const dailyBudget  = formData.get('daily_budget') as string
  const audience     = formData.get('audience') as string
  const assetId      = formData.get('asset_id') as string | null

  if (!campaignName) return { error: 'اسم الحملة مطلوب' }

  const keyName = platform === 'meta' ? 'meta_ads' : 'google_ads'
  const apiKey  = await getVaultKey(companyId, keyName)

  if (!apiKey) return { error: `مفتاح ${keyName} غير موجود في API Vault — أضفه أولاً` }

  // In production: call Meta / Google Ads API to create campaign
  // Log the campaign intent to creative_assets
  await supabase.from('creative_assets').insert({
    company_id:  companyId,
    created_by:  user.id,
    asset_type:  'ad_campaign',
    title:       campaignName,
    provider:    platform,
    status:      'active',
    metadata:    { objective, daily_budget: dailyBudget, audience, source_asset_id: assetId, platform },
  })

  return { success: true }
}
