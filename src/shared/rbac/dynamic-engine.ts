import 'server-only'

import { cache } from 'react'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { hasPermission, type Permission } from './permissions'
import type { AppRole } from '@/shared/auth/types'

export interface PermissionOverride {
  permission_key: string
  granted: boolean
  source: 'role' | 'override'
  reason?: string
}

/**
 * Resolves the effective permission set for a user by combining:
 *  1. Role-based permissions (static ROLE_PERMISSIONS map)
 *  2. DB-stored user_permission_overrides (explicit SA grants / revokes)
 *
 * Overrides always beat role defaults.
 */
export const getUserEffectivePermissions = cache(async (userId: string): Promise<PermissionOverride[]> => {
  const supabase = await createServerSupabaseClient()

  const { data: overrides } = await supabase
    .from('user_permission_overrides')
    .select('permission_id, granted, reason, permissions!inner(key)')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.now()')

  return (overrides ?? []).map((o) => ({
    permission_key: ((o.permissions as unknown as { key: string } | null))?.key ?? '',
    granted: o.granted,
    source: 'override' as const,
    reason: o.reason ?? undefined,
  })).filter((o) => o.permission_key !== '')
})

/**
 * Check if a user has a specific permission, respecting DB overrides.
 * Falls back to static role-based check when no override exists.
 */
export async function checkPermission(
  userId: string,
  role: AppRole,
  permission: Permission,
): Promise<boolean> {
  const overrides = await getUserEffectivePermissions(userId)
  const override = overrides.find((o) => o.permission_key === permission)

  if (override) return override.granted

  return hasPermission(role, permission)
}

/**
 * Loads ALL users with their roles for the Permission Matrix UI.
 * Super Admin only.
 */
export async function loadPermissionMatrixData() {
  const supabase = createServiceRoleClient()

  const [{ data: profiles }, { data: permissions }, { data: overrides }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name'),
    supabase
      .from('permissions')
      .select('id, key, resource, action, description')
      .order('resource, action'),
    supabase
      .from('user_permission_overrides')
      .select('user_id, permission_id, granted, reason, granted_by'),
  ])

  return {
    profiles: profiles ?? [],
    permissions: permissions ?? [],
    overrides: overrides ?? [],
  }
}

export type PermissionMatrixData = Awaited<ReturnType<typeof loadPermissionMatrixData>>
