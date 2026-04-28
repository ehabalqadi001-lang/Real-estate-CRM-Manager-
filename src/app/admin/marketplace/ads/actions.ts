'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createServiceRoleClient } from '@/lib/supabase/service'

const ADMIN_ADS_PATH = '/admin/marketplace/ads'

async function logAction(
  supabase: ReturnType<typeof createServiceRoleClient>,
  adId: string,
  action: string,
  performedBy: string,
  extra?: { reason?: string; notes?: string; previousStatus?: string; newStatus?: string }
) {
  const { error } = await supabase.from('ad_review_logs').insert({
    ad_id: adId,
    action,
    previous_status: extra?.previousStatus ?? null,
    new_status: extra?.newStatus ?? null,
    reason: extra?.reason ?? null,
    notes: extra?.notes ?? null,
    performed_by: performedBy,
  })

  if (error) throw new Error(error.message)
}

async function resolveAdStatus(supabase: ReturnType<typeof createServiceRoleClient>, adId: string) {
  const { data: ad, error } = await supabase
    .from('ads')
    .select('status')
    .eq('id', adId)
    .maybeSingle()

  if (error) return { error: error.message, status: null }
  if (!ad) return { error: 'Ad not found.', status: null }

  return { error: null, status: ad.status }
}

export async function toggleFeatureAdAction(adId: string, featured: boolean) {
  const session = await requirePermission('admin.view')
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('ads')
    .update({ is_featured_admin: featured })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  try {
    await logAction(supabase, adId, featured ? 'featured' : 'unfeatured', session.user.id)
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to log the update.' }
  }

  revalidatePath(ADMIN_ADS_PATH)
  return { success: true }
}

export async function togglePinAdAction(adId: string, pinned: boolean) {
  const session = await requirePermission('admin.view')
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('ads')
    .update({ is_pinned: pinned })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  try {
    await logAction(supabase, adId, pinned ? 'pinned' : 'unpinned', session.user.id)
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to log the update.' }
  }

  revalidatePath(ADMIN_ADS_PATH)
  return { success: true }
}

export async function toggleHideAdAction(adId: string, hidden: boolean) {
  const session = await requirePermission('admin.view')
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('ads')
    .update({ is_hidden_admin: hidden })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  try {
    await logAction(supabase, adId, hidden ? 'hidden' : 'unhidden', session.user.id)
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to log the update.' }
  }

  revalidatePath(ADMIN_ADS_PATH)
  return { success: true }
}

export async function changeCategoryAction(adId: string, category: string) {
  const session = await requirePermission('admin.view')
  const supabase = createServiceRoleClient()

  const normalizedCategory = category.trim() || null
  const { error } = await supabase
    .from('ads')
    .update({ admin_category: normalizedCategory })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  try {
    await logAction(supabase, adId, 'category_changed', session.user.id, { notes: normalizedCategory ?? '' })
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to log the update.' }
  }

  revalidatePath(ADMIN_ADS_PATH)
  return { success: true }
}

export async function approveAdAction(adId: string) {
  const session = await requirePermission('admin.view')
  const supabase = createServiceRoleClient()

  const current = await resolveAdStatus(supabase, adId)
  if (current.error) return { success: false, message: current.error }

  const { error } = await supabase
    .from('ads')
    .update({
      status: 'approved',
      rejection_reason: null,
      edit_request_notes: null,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  try {
    await logAction(supabase, adId, 'approved', session.user.id, {
      previousStatus: current.status ?? undefined,
      newStatus: 'approved',
    })
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to log the update.' }
  }

  revalidatePath(ADMIN_ADS_PATH)
  return { success: true }
}

export async function rejectAdAction(adId: string, reason: string) {
  const normalizedReason = reason.trim()
  if (!normalizedReason) return { success: false, message: 'Rejection reason is required.' }

  const session = await requirePermission('admin.view')
  const supabase = createServiceRoleClient()

  const current = await resolveAdStatus(supabase, adId)
  if (current.error) return { success: false, message: current.error }

  const { error } = await supabase
    .from('ads')
    .update({
      status: 'rejected',
      rejection_reason: normalizedReason,
      edit_request_notes: null,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  try {
    await logAction(supabase, adId, 'rejected', session.user.id, {
      previousStatus: current.status ?? undefined,
      newStatus: 'rejected',
      reason: normalizedReason,
    })
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to log the update.' }
  }

  revalidatePath(ADMIN_ADS_PATH)
  return { success: true }
}

export async function requestEditAdAction(adId: string, notes: string) {
  const normalizedNotes = notes.trim()
  if (!normalizedNotes) return { success: false, message: 'Edit notes are required.' }

  const session = await requirePermission('admin.view')
  const supabase = createServiceRoleClient()

  const current = await resolveAdStatus(supabase, adId)
  if (current.error) return { success: false, message: current.error }

  const { error } = await supabase
    .from('ads')
    .update({
      status: 'edit_requested',
      edit_request_notes: normalizedNotes,
      rejection_reason: null,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', adId)

  if (error) return { success: false, message: error.message }

  try {
    await logAction(supabase, adId, 'edit_requested', session.user.id, {
      previousStatus: current.status ?? undefined,
      newStatus: 'edit_requested',
      notes: normalizedNotes,
    })
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to log the update.' }
  }

  revalidatePath(ADMIN_ADS_PATH)
  return { success: true }
}
