import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function cookieHandler() {
  const cookieStore = await cookies()
  return {
    getAll() { return cookieStore.getAll() },
    setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[]) {
      try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
      catch {}
    },
  }
}

/**
 * Legacy untyped client.
 *
 * The hand-written Database type in src/lib/types/db.ts is currently out of sync
 * with the live schema and resolves several table writes to `never`. Keep this
 * legacy client untyped until generated Supabase types are introduced under
 * src/shared/db and each domain is migrated behind repositories.
 */
export async function createServerClient() {
  const c = await cookieHandler()
  return _createServerClient(
    supabaseUrl!,
    supabaseKey!,
    { cookies: c }
  )
}

/** Untyped client — use when the typed Database generic resolves update/insert to `never` */
export async function createRawClient() {
  const c = await cookieHandler()
  return _createServerClient(
    supabaseUrl!,
    supabaseKey!,
    { cookies: c }
  )
}

export async function getSession() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getProfile() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
}

// Roles whose own profile.id acts as the company_id when company_id is null
const SELF_AS_COMPANY_ROLES = new Set([
  'company_owner', 'company_admin', 'company',
  'admin', 'Admin', 'super_admin', 'platform_admin',
])

export async function getCompanyId(): Promise<string | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()
  if (!data) return null
  if (data.company_id) return data.company_id
  if (SELF_AS_COMPANY_ROLES.has(data.role ?? '')) return user.id
  return null
}
