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
      .select('id, company_name, logo_url, primary_brand_color, primary_color')
      .eq('id', tenantId)
      .maybeSingle()
    : { data: null }

  const effectiveRole = await resolveEffectiveRole({
    supabase,
    userId: user.id,
    email: user.email ?? null,
    rawRole: profile?.role as string | null | undefined,
  })

  const appProfile: AppProfile = {
    id: user.id,
    company_id: (profile?.company_id as string | null | undefined) ?? null,
    tenant_id: tenantId,
    tenant_name: (tenant?.company_name as string | null | undefined) ?? null,
    tenant_logo_url: (tenant?.logo_url as string | null | undefined) ?? null,
    tenant_primary_brand_color: (tenant?.primary_color as string | null | undefined) ?? (tenant?.primary_brand_color as string | null | undefined) ?? null,
    full_name: (profile?.full_name as string | null | undefined) ?? user.email?.split('@')[0] ?? null,
    email: user.email,
    role: effectiveRole,
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

async function resolveEffectiveRole({
  supabase,
  userId,
  email,
  rawRole,
}: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  userId: string
  email: string | null
  rawRole: string | null | undefined
}): Promise<AppRole> {
  const normalized = normalizeRole(rawRole)
  if (normalized === 'super_admin' || normalized === 'platform_admin') return normalized
  if (isConfiguredPlatformOwner(email)) return 'super_admin'

  const [{ data: legacyRoles }, { data: assignedRoles }] = await Promise.all([
    supabase
      .from('user_roles')
      .select('role_type, is_active')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('user_role_assignments')
      .select('roles(slug)')
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
  ])

  const hasLegacySuperAdmin = (legacyRoles ?? []).some((role) => role.role_type === 'super_admin')
  const hasAssignedSuperAdmin = (assignedRoles ?? []).some((assignment) => {
    const role = Array.isArray(assignment.roles) ? assignment.roles[0] : assignment.roles
    return role?.slug === 'super_admin_fi' || role?.slug === 'super_admin' || role?.slug === 'platform_admin'
  })

  return hasLegacySuperAdmin || hasAssignedSuperAdmin ? 'super_admin' : normalized
}

function isConfiguredPlatformOwner(email: string | null) {
  if (!email) return false
  const configured = [
    process.env.FAST_INVESTMENT_SUPER_ADMIN_EMAILS,
    process.env.SUPER_ADMIN_EMAILS,
    'admin@fastinvestment.com',
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return configured.includes(email.toLowerCase())
}
