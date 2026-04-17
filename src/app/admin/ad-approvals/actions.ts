'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'

export async function approveAdAction(formData: FormData) {
  const adId = String(formData.get('ad_id') ?? '')
  if (!adId) return

  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('ads')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', adId)

  revalidatePath('/admin/ad-approvals')
  revalidatePath('/marketplace')
}

export async function rejectAdAction(formData: FormData) {
  const adId = String(formData.get('ad_id') ?? '')
  const reason = String(formData.get('reason') ?? 'تم رفض الإعلان بعد المراجعة')
  if (!adId) return

  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('ads')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', adId)

  revalidatePath('/admin/ad-approvals')
}
