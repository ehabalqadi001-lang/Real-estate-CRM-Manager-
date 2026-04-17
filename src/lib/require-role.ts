import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type Role = 'agent' | 'admin' | 'company_admin' | 'super_admin'

const ADMIN_ROLES: Role[] = ['admin', 'company_admin', 'super_admin', 'Admin', 'company'] as Role[]
const SUPER_ROLES: Role[] = ['super_admin', 'Super_Admin'] as Role[]

export async function getServerUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id, full_name')
    .eq('id', user.id)
    .single()

  return { user, role: profile?.role ?? 'agent', profile, supabase }
}

export async function requireAuth() {
  const result = await getServerUser()
  if (!result.user) redirect('/login')
  return result
}

export async function requireAdmin() {
  const result = await requireAuth()
  const isAdmin = ADMIN_ROLES.includes(result.role as Role) || SUPER_ROLES.includes(result.role as Role)
  if (!isAdmin) redirect('/dashboard')
  return result
}

export async function requireSuperAdmin() {
  const result = await requireAuth()
  const isSuperAdmin = SUPER_ROLES.includes(result.role as Role)
  if (!isSuperAdmin) redirect('/dashboard')
  return result
}

export function isAdminRole(role: string | null): boolean {
  return ADMIN_ROLES.includes(role as Role) || SUPER_ROLES.includes(role as Role)
}
