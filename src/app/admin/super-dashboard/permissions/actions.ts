'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function upsertPermissionOverride(formData: FormData) {
  const session = await requirePermission('platform.manage')

  const supabase = createServiceRoleClient()

  const targetUserId = formData.get('user_id') as string
  const permissionId = formData.get('permission_id') as string
  const granted = formData.get('granted') === 'true'
  const reason = (formData.get('reason') as string | null) ?? undefined

  if (!targetUserId || !permissionId) return { error: 'Missing fields' }

  const { error } = await supabase
    .from('user_permission_overrides')
    .upsert(
      {
        user_id: targetUserId,
        permission_id: permissionId,
        granted,
        granted_by: session.user.id,
        reason: reason ?? null,
      },
      { onConflict: 'user_id,permission_id' },
    )

  if (error) return { error: error.message }

  revalidatePath('/admin/super-dashboard/permissions')
  return { success: true }
}

export async function removePermissionOverride(formData: FormData) {
  await requirePermission('platform.manage')

  const supabase = createServiceRoleClient()
  const targetUserId = formData.get('user_id') as string
  const permissionId = formData.get('permission_id') as string

  if (!targetUserId || !permissionId) return { error: 'Missing fields' }

  const { error } = await supabase
    .from('user_permission_overrides')
    .delete()
    .eq('user_id', targetUserId)
    .eq('permission_id', permissionId)

  if (error) return { error: error.message }

  revalidatePath('/admin/super-dashboard/permissions')
  return { success: true }
}

export async function bulkGrantRolePermissions(formData: FormData) {
  const session = await requirePermission('platform.manage')

  const supabase = createServiceRoleClient()

  const targetUserId = formData.get('user_id') as string
  const permissionKeys = JSON.parse(formData.get('permission_keys') as string) as string[]
  const granted = formData.get('granted') === 'true'

  if (!targetUserId || !permissionKeys.length) return { error: 'Missing fields' }

  const { data: perms } = await supabase
    .from('permissions')
    .select('id')
    .in('key', permissionKeys)

  if (!perms?.length) return { error: 'Permissions not found' }

  const rows = perms.map((p) => ({
    user_id: targetUserId,
    permission_id: p.id,
    granted,
    granted_by: session.user.id,
  }))

  const { error } = await supabase
    .from('user_permission_overrides')
    .upsert(rows, { onConflict: 'user_id,permission_id' })

  if (error) return { error: error.message }

  revalidatePath('/admin/super-dashboard/permissions')
  return { success: true }
}
