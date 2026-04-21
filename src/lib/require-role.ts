import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { hasPermission, normalizeRole } from '@/lib/permissions'

export async function getServerUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null, supabase }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role, company_id, full_name, status')
    .eq('id', user.id)
    .maybeSingle()

  const { data: legacyProfile } = userProfile ? { data: null } : await supabase
    .from('profiles')
    .select('role, company_id, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const profile = userProfile ?? legacyProfile
  return { user, role: normalizeRole(profile?.role ?? 'viewer'), profile, supabase }
}

export async function requireAuth() {
  const result = await getServerUser()
  if (!result.user) redirect('/login')
  return result
}

export async function requireAdmin() {
  const result = await requireAuth()
  if (!hasPermission(result.role, 'team:manage')) redirect('/dashboard')
  return result
}

export async function requireSuperAdmin() {
  const result = await requireAuth()
  if (result.role !== 'super_admin') redirect('/dashboard')
  return result
}

export function isAdminRole(role: string | null): boolean {
  return hasPermission(role, 'team:manage')
}
