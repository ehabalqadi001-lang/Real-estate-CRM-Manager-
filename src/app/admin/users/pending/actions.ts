'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function getPendingUsers() {
  await requirePermission('users.read')
  const supabase = await createServerSupabaseClient()

  const [{ data: userProfiles, error }, { data: legacyProfiles }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  if (error) throw new Error(error.message)
  return userProfiles && userProfiles.length > 0 ? userProfiles : legacyProfiles || []
}

export async function updateUserStatus(userId: string, newStatus: 'approved' | 'rejected') {
  await requirePermission('users.update')
  const supabase = await createServerSupabaseClient()
  const userProfileStatus = newStatus === 'approved' ? 'active' : 'rejected'

  const { error: userProfileError } = await supabase
    .from('user_profiles')
    .update({
      status: userProfileStatus,
      onboarding_completed: newStatus === 'approved',
    })
    .eq('id', userId)

  const { error: legacyError } = await supabase
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', userId)

  if (userProfileError && legacyError) throw new Error(userProfileError.message)

  revalidatePath('/admin/users/pending')
  return { success: true }
}
