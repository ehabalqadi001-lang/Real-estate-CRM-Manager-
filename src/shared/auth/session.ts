import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { AppProfile, AppRole, AppSession } from './types'

const ROLE_ALIASES: Record<string, AppRole> = {
  Super_Admin: 'super_admin',
  super_admin: 'super_admin',
  admin: 'company_admin',
  Admin: 'company_admin',
  company: 'company_owner',
  company_admin: 'company_admin',
  agent: 'agent',
}

function normalizeRole(role: string | null | undefined): AppRole {
  if (!role) return 'agent'
  return ROLE_ALIASES[role] ?? (role as AppRole)
}

export const getCurrentSession = cache(async (): Promise<AppSession | null> => {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_id, full_name, role, account_type, status, is_active')
    .eq('id', user.id)
    .single()

  const appProfile: AppProfile = {
    id: user.id,
    company_id: (profile?.company_id as string | null | undefined) ?? null,
    full_name: (profile?.full_name as string | null | undefined) ?? user.email?.split('@')[0] ?? null,
    email: user.email,
    role: normalizeRole(profile?.role as string | null | undefined),
    account_type: (profile?.account_type as string | null | undefined) ?? null,
    status: (profile?.status as string | null | undefined) ?? null,
    is_active: (profile?.is_active as boolean | null | undefined) ?? true,
  }

  return { user, profile: appProfile }
})

export async function requireSession(): Promise<AppSession> {
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  return session
}

