'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'
import { normalizeRole } from '@/lib/permissions'

const FI_ROLES = [
  'ad_reviewer',
  'ad_manager',
  'users_am',
  'ads_am',
  'am_supervisor',
  'collection_rep',
  'finance_manager',
  'inventory_rep',
  'data_manager',
  'campaign_specialist',
  'marketing_manager',
  'cs_agent',
  'cs_supervisor',
  'super_admin_fi',
]

export async function assignRoleAction(formData: FormData) {
  await requirePermission('platform.manage')

  const userId = String(formData.get('user_id') ?? '')
  const submittedRole = String(formData.get('role') ?? '')
  if (!userId || !submittedRole) return { error: 'بيانات ناقصة' }

  const supabase = await createRawClient()
  const role = FI_ROLES.includes(submittedRole) ? submittedRole : normalizeRole(submittedRole)

  const { error: userProfileError } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', userId)

  const { error: legacyError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (userProfileError && legacyError) return { error: userProfileError.message }

  if (FI_ROLES.includes(role)) {
    const { data: roleRow } = await supabase
      .from('roles')
      .select('id')
      .eq('slug', role)
      .maybeSingle()

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
