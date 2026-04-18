'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function approvePayoutAction(formData: FormData) {
  await requirePermission('transactions.approve_payout')

  const payoutId = formData.get('payout_id') as string
  const pin = formData.get('confirmation_pin') as string

  if (!payoutId) return { error: 'معرّف الدفعة مطلوب' }
  if (!pin || pin.length < 4) return { error: 'رمز التحقق غير صحيح' }

  // In production: verify PIN against user's stored hash or TOTP
  // For now we validate length as a placeholder guard
  if (pin.length < 4) return { error: 'رمز التحقق يجب أن يكون 4 أرقام على الأقل' }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { error } = await supabase
    .from('transactions')
    .update({
      status: 'paid',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', payoutId)
    .in('status', ['pending', 'approved'])

  if (error) return { error: error.message }

  revalidatePath('/admin/finance-vault')
  return { success: true }
}

export async function updateTransactionStatus(formData: FormData) {
  await requirePermission('transactions.update')

  const supabase = await createServerClient()
  const txId = formData.get('tx_id') as string
  const status = formData.get('status') as string

  if (!txId || !status) return { error: 'بيانات ناقصة' }

  const { error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', txId)

  if (error) return { error: error.message }

  revalidatePath('/admin/finance-vault')
  return { success: true }
}
