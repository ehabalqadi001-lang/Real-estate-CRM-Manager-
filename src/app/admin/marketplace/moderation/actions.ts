'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'

const R = '/admin/marketplace/moderation'

export async function approveAdAction(adId: string) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const { data: ad } = await supabase.from('ads').select('status').eq('id', adId).maybeSingle()
  if (!ad) return { success: false, message: 'الإعلان غير موجود' }

  const { error } = await supabase
    .from('ads')
    .update({
      status: 'approved',
      rejection_reason: null,
      edit_request_notes: null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  await supabase.from('ad_review_logs').insert({
    ad_id: adId,
    action: 'approved',
    previous_status: ad.status,
    new_status: 'approved',
    performed_by: user.id,
  })

  revalidatePath(R)
  return { success: true }
}

export async function rejectAdAction(adId: string, reason: string) {
  if (!reason.trim()) return { success: false, message: 'سبب الرفض مطلوب' }

  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const { data: ad } = await supabase.from('ads').select('status').eq('id', adId).maybeSingle()
  if (!ad) return { success: false, message: 'الإعلان غير موجود' }

  const { error } = await supabase
    .from('ads')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  await supabase.from('ad_review_logs').insert({
    ad_id: adId,
    action: 'rejected',
    previous_status: ad.status,
    new_status: 'rejected',
    reason: reason.trim(),
    performed_by: user.id,
  })

  revalidatePath(R)
  return { success: true }
}

export async function requestEditAction(adId: string, notes: string) {
  if (!notes.trim()) return { success: false, message: 'ملاحظات التعديل مطلوبة' }

  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const { data: ad } = await supabase.from('ads').select('status').eq('id', adId).maybeSingle()
  if (!ad) return { success: false, message: 'الإعلان غير موجود' }

  const { error } = await supabase
    .from('ads')
    .update({
      status: 'edit_requested',
      edit_request_notes: notes.trim(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  await supabase.from('ad_review_logs').insert({
    ad_id: adId,
    action: 'edit_requested',
    previous_status: ad.status,
    new_status: 'edit_requested',
    notes: notes.trim(),
    performed_by: user.id,
  })

  revalidatePath(R)
  return { success: true }
}
