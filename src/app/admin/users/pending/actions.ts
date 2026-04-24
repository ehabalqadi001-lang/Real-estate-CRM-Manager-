'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { isSuperAdmin } from '@/shared/auth/types'

async function assertSuperAdmin() {
  const session = await requireSession()
  if (!isSuperAdmin(session.profile.role)) throw new Error('غير مصرح')
}

export async function getPendingUsers() {
  await assertSuperAdmin()
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, account_type, phone, region, company_name, commercial_reg_no, id_document_url, license_document_url, created_at')
    .eq('account_status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function updateUserStatus(userId: string, newStatus: 'approved' | 'rejected') {
  await assertSuperAdmin()
  const supabase = createServiceRoleClient()
  const userProfileStatus = newStatus === 'approved' ? 'active' : 'rejected'
  const { error } = await supabase
    .from('user_profiles')
    .update({ account_status: userProfileStatus, onboarding_completed: newStatus === 'approved' })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users/pending')
}
