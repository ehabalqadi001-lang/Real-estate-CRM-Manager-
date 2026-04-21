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
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id, full_name, phone, avatar_url, role, account_type, company_id, branch_id, status, onboarding_completed')
          .eq('id', currentUser.id)
          .maybeSingle()

        const { data: legacyProfile } = userProfile ? { data: null } : await supabase
          .from('profiles')
          .select('id, full_name, phone, role, account_type, company_id, status')
          .eq('id', currentUser.id)
          .maybeSingle()

        const data = userProfile ?? legacyProfile
        if (mounted && data) {
          const profileRecord = data as {
            id: string
            full_name: string | null
            phone: string | null
            avatar_url?: string | null
            role: string | null
            account_type: string | null
            company_id: string | null
            branch_id?: string | null
            status: string | null
            onboarding_completed?: boolean | null
          }
          setProfile({
            id: profileRecord.id,
            full_name: profileRecord.full_name,
            phone: profileRecord.phone,
            avatar_url: profileRecord.avatar_url ?? null,
            role: normalizeRole(profileRecord.role ?? 'viewer'),
            account_type: profileRecord.account_type,
            company_id: profileRecord.company_id,
            branch_id: profileRecord.branch_id ?? null,
            status: profileRecord.status,
            onboarding_completed: profileRecord.onboarding_completed ?? profileRecord.status !== 'pending',
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
