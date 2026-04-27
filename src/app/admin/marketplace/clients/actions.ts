'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'

export async function suspendClientAction(clientId: string, suspend: boolean) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const { error } = await supabase
    .from('profiles')
    .update({
      status: suspend ? 'suspended' : 'active',
      is_active: !suspend,
    })
    .eq('id', clientId)

  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/marketplace/clients')
  revalidatePath(`/admin/marketplace/clients/${clientId}`)
  return { success: true }
}

export async function manualWalletAdjustAction(
  clientId: string,
  direction: 'credit' | 'deduct',
  points: number,
  reason: string
) {
  if (!reason.trim()) return { success: false, message: 'السبب مطلوب' }
  if (points <= 0 || !Number.isFinite(points)) return { success: false, message: 'المبلغ غير صالح' }

  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const delta = direction === 'credit' ? points : -points

  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('points_balance')
    .eq('user_id', clientId)
    .maybeSingle()

  const currentBalance = Number(wallet?.points_balance ?? 0)
  if (direction === 'deduct' && currentBalance < points) {
    return { success: false, message: 'الرصيد غير كافٍ للخصم' }
  }

  const newBalance = currentBalance + delta

  let rpcError: unknown = null
  try {
    await supabase.rpc('adjust_wallet_points', {
      p_user_id: clientId,
      p_delta: delta,
      p_reason: reason.trim(),
      p_type: direction === 'credit' ? 'manual_grant' : 'manual_deduct',
      p_performed_by: user.id,
    })
  } catch (e) {
    rpcError = e
  }

  // Fallback: direct table update if RPC not available
  if (rpcError) {
    const { error: directErr } = await supabase
      .from('user_wallets')
      .update({ points_balance: newBalance })
      .eq('user_id', clientId)

    if (directErr) return { success: false, message: directErr.message }

    await supabase.from('wallet_transactions').insert({
      user_id: clientId,
      type: direction === 'credit' ? 'manual_grant' : 'manual_deduct',
      points_delta: delta,
      balance_after: newBalance,
      reason: reason.trim(),
    })
  }

  revalidatePath(`/admin/marketplace/clients/${clientId}`)
  return { success: true }
}
