'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function updateUserStatus(formData: FormData) {
  await requirePermission('admin.view')
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? 'active')
  const supabase = await createRawClient()
  await supabase.from('user_profiles').update({ status }).eq('id', id)
  revalidatePath('/admin/users')
}

export async function updateUserRole(formData: FormData) {
  await requirePermission('admin.view')
  const id = String(formData.get('id') ?? '')
  const role = String(formData.get('role') ?? 'agent')
  const supabase = await createRawClient()
  await supabase.from('user_profiles').update({ role }).eq('id', id)
  revalidatePath('/admin/users')
}
