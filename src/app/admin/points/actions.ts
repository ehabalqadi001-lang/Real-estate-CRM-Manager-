'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function updatePaymobSettings(formData: FormData) {
  await requirePermission('platform.manage')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const payload: Record<string, string | null | undefined> = {
    updated_by: user.id,
    updated_at: new Date().toISOString(),
    card_integration_id: String(formData.get('card_integration_id') ?? '').trim() || null,
    wallet_integration_id: String(formData.get('wallet_integration_id') ?? '').trim() || null,
    card_iframe_id: String(formData.get('card_iframe_id') ?? '').trim() || null,
  }

  const apiKey = String(formData.get('api_key') ?? '').trim()
  const hmacSecret = String(formData.get('hmac_secret') ?? '').trim()
  if (apiKey) payload.api_key = apiKey
  if (hmacSecret) payload.hmac_secret = hmacSecret

  const { error } = await supabase
    .from('paymob_settings')
    .upsert({ id: true, ...payload }, { onConflict: 'id' })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/points')
}

export async function updateAdCosts(formData: FormData) {
  await requirePermission('platform.manage')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ad_cost_config')
    .upsert({
      id: true,
      regular_points_cost: Number(formData.get('regular_points_cost') ?? 10),
      premium_points_cost: Number(formData.get('premium_points_cost') ?? 50),
      regular_duration_days: Number(formData.get('regular_duration_days') ?? 30),
      premium_duration_days: Number(formData.get('premium_duration_days') ?? 30),
      points_per_egp: Number(formData.get('points_per_egp') ?? 10),
      updated_by: user.id,
    }, { onConflict: 'id' })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/points')
}

export async function manualWalletOverride(formData: FormData) {
  await requirePermission('platform.manage')
  const supabase = await createServerClient()

  const userId = String(formData.get('user_id') ?? '')
  const points = Number(formData.get('points') ?? 0)
  const direction = String(formData.get('direction') ?? 'grant')
  const reason = String(formData.get('reason') ?? '').trim()

  if (!userId || !Number.isFinite(points) || points <= 0) throw new Error('User and positive point amount are required')

  const { data: walletId, error: walletError } = await supabase.rpc('ensure_user_wallet', { p_user_id: userId })
  if (walletError) throw new Error(walletError.message)

  const { data: wallet, error: readError } = await supabase
    .from('user_wallets')
    .select('id, points_balance, lifetime_points_earned, lifetime_points_spent, tenant_id')
    .eq('id', walletId)
    .single()

  if (readError || !wallet) throw new Error(readError?.message ?? 'Wallet not found')

  const delta = direction === 'deduct' ? -Math.abs(points) : Math.abs(points)
  const nextBalance = Number(wallet.points_balance ?? 0) + delta
  if (nextBalance < 0) throw new Error('Deduction would create a negative wallet balance')

  const { error: updateError } = await supabase
    .from('user_wallets')
    .update({
      points_balance: nextBalance,
      lifetime_points_earned: direction === 'grant' ? Number(wallet.lifetime_points_earned ?? 0) + Math.abs(points) : Number(wallet.lifetime_points_earned ?? 0),
      lifetime_points_spent: direction === 'deduct' ? Number(wallet.lifetime_points_spent ?? 0) + Math.abs(points) : Number(wallet.lifetime_points_spent ?? 0),
    })
    .eq('id', wallet.id)

  if (updateError) throw new Error(updateError.message)

  const { error: txError } = await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      tenant_id: wallet.tenant_id,
      type: direction === 'deduct' ? 'manual_deduct' : 'manual_grant',
      points_delta: delta,
      balance_after: nextBalance,
      reason,
    })

  if (txError) throw new Error(txError.message)

  revalidatePath('/admin/points')
}
