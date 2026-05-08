'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'
import bcrypt from 'bcryptjs'

export async function approvePayoutAction(formData: FormData) {
  await requirePermission('transactions.approve_payout')

  const payoutId = formData.get('payout_id') as string
  const pin = formData.get('confirmation_pin') as string

  if (!payoutId) return { error: 'معرّف الدفعة مطلوب' }
  if (!pin || !/^\d{4,6}$/.test(pin)) return { error: 'رمز التحقق يجب أن يكون 4-6 أرقام' }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  // Verify PIN against stored bcrypt hash
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('approval_pin_hash')
    .eq('id', user.id)
    .single()

  if (!profile?.approval_pin_hash) {
    return { error: 'لم يتم إعداد رمز الموافقة بعد — يرجى تعيينه من صفحة الإعدادات' }
  }

  const valid = await bcrypt.compare(pin, profile.approval_pin_hash)
  if (!valid) return { error: 'رمز التحقق غير صحيح' }

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

export async function setApprovalPinAction(formData: FormData) {
  await requirePermission('transactions.approve_payout')

  const pin = formData.get('pin') as string
  const confirmPin = formData.get('confirm_pin') as string

  if (!pin || !/^\d{4,6}$/.test(pin)) return { error: 'الرمز يجب أن يكون 4-6 أرقام' }
  if (pin !== confirmPin) return { error: 'الرمزان غير متطابقان' }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const hash = await bcrypt.hash(pin, 12)

  const { error } = await supabase
    .from('user_profiles')
    .update({ approval_pin_hash: hash })
    .eq('id', user.id)

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
