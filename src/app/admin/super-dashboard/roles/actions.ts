'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function assignRoleAction(formData: FormData) {
  await requirePermission('platform.manage')

  const userId = formData.get('user_id') as string
  const role   = formData.get('role') as string

  if (!userId || !role) return { error: 'بيانات ناقصة' }

  const supabase = await createRawClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  // Also add to user_role_assignments if it's a FI departmental role
  const FI_ROLES = [
    'ad_reviewer','ad_manager','users_am','ads_am','am_supervisor',
    'collection_rep','finance_manager','inventory_rep','data_manager',
    'campaign_specialist','marketing_manager','cs_agent','cs_supervisor','super_admin_fi',
  ]

  if (FI_ROLES.includes(role)) {
    const { data: roleRow } = await supabase
      .from('roles')
      .select('id')
      .eq('slug', role)
      .single()

    if (roleRow) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('user_role_assignments')
        .upsert(
          { user_id: userId, role_id: roleRow.id, granted_by: user?.id ?? null },
          { onConflict: 'user_id,role_id' },
        )
    }
  }

  revalidatePath('/admin/super-dashboard/roles')
  return { success: true }
}
