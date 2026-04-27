'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'

const R = '/admin/marketplace/ads'

async function logAction(
  adId: string,
  action: string,
  performedBy: string,
  extra?: { reason?: string; notes?: string; previousStatus?: string; newStatus?: string }
) {
  const supabase = await createRawClient()
  await supabase.from('ad_review_logs').insert({
    ad_id: adId,
    action,
    previous_status: extra?.previousStatus,
    new_status: extra?.newStatus,
    reason: extra?.reason,
    notes: extra?.notes,
    performed_by: performedBy,
  })
}

export async function toggleFeatureAdAction(adId: string, featured: boolean) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const { error } = await supabase
    .from('ads')
    .update({ is_featured_admin: featured })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }
  await logAction(adId, featured ? 'featured' : 'unfeatured', user.id)
  revalidatePath(R)
  return { success: true }
}

export async function togglePinAdAction(adId: string, pinned: boolean) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const { error } = await supabase
    .from('ads')
    .update({ is_pinned: pinned })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }
  await logAction(adId, pinned ? 'pinned' : 'unpinned', user.id)
  revalidatePath(R)
  return { success: true }
}

export async function toggleHideAdAction(adId: string, hidden: boolean) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const { error } = await supabase
    .from('ads')
    .update({ is_hidden_admin: hidden })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }
  await logAction(adId, hidden ? 'hidden' : 'unhidden', user.id)
  revalidatePath(R)
  return { success: true }
}

export async function changeCategoryAction(adId: string, category: string) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'غير مصرح' }

  const { error } = await supabase
    .from('ads')
    .update({ admin_category: category || null })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }
  await logAction(adId, 'category_changed', user.id, { notes: category })
  revalidatePath(R)
  return { success: true }
}
