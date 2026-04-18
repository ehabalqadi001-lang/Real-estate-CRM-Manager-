import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { AppProfile, AppRole, AppSession } from './types'

const ROLE_ALIASES: Record<string, AppRole> = {
  'Super Admin': 'super_admin',
  Super_Admin: 'super_admin',
  SuperAdmin: 'super_admin',
  super_admin: 'super_admin',
  platform_admin: 'platform_admin',
  'Platform Admin': 'platform_admin',
  admin: 'company_admin',
  Admin: 'company_admin',
  'Company Admin': 'company_admin',
  company: 'company_owner',
  company_admin: 'company_admin',
  broker: 'broker',
  agent: 'agent',
  Agent: 'agent',
  CLIENT: 'viewer',
  client: 'viewer',
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
    .select('id, company_id, tenant_id, full_name, role, account_type, status, is_active')
    .eq('id', user.id)
    .single()

  const tenantId = (profile?.tenant_id as string | null | undefined)
    ?? (profile?.company_id as string | null | undefined)
    ?? null
  const { data: tenant } = tenantId
    ? await supabase
      .from('tenants')
      .select('id, company_name, logo_url, primary_brand_color')
      .eq('id', tenantId)
      .maybeSingle()
    : { data: null }

  const appProfile: AppProfile = {
    id: user.id,
    company_id: (profile?.company_id as string | null | undefined) ?? null,
    tenant_id: tenantId,
    tenant_name: (tenant?.company_name as string | null | undefined) ?? null,
    tenant_logo_url: (tenant?.logo_url as string | null | undefined) ?? null,
    tenant_primary_brand_color: (tenant?.primary_brand_color as string | null | undefined) ?? null,
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
