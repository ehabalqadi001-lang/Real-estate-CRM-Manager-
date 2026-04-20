'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/shared/supabase/browser'
import { canAccess as canAccessPermission, hasPermission as hasRolePermission, normalizeRole, type Permission, type ResourceAction, type Role } from '@/lib/permissions'

export type AuthProfile = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url?: string | null
  role: Role
  account_type: string | null
  company_id: string | null
  branch_id?: string | null
  status: string | null
  onboarding_completed?: boolean | null
}

export function useAuth() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const timeout = window.setTimeout(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(currentUser)

      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role, account_type, company_id, status')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (mounted && data) {
          setProfile({
            id: data.id,
            full_name: data.full_name,
            phone: data.phone,
            role: normalizeRole(data.role ?? 'viewer'),
            account_type: data.account_type,
            company_id: data.company_id,
            status: data.status,
          })
        }
      }

      if (mounted) setLoading(false)
    }, 0)

    return () => {
      mounted = false
      window.clearTimeout(timeout)
    }
  }, [supabase])

  const role = profile?.role ?? null

  return {
    user,
    profile,
    role,
    permissions: {
      hasPermission: (permission: Permission | string) => hasRolePermission(role, permission),
      isRole: (...roles: Role[]) => Boolean(role && roles.includes(role)),
      canAccess: (resource: string, action: ResourceAction) => canAccessPermission(role, resource, action),
    },
    hasPermission: (permission: Permission | string) => hasRolePermission(role, permission),
    isRole: (...roles: Role[]) => Boolean(role && roles.includes(role)),
    canAccess: (resource: string, action: ResourceAction) => canAccessPermission(role, resource, action),
    loading,
  }
}
