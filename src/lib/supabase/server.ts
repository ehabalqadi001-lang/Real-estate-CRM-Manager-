import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: c }
  )
}

/** Untyped client — use when the typed Database generic resolves update/insert to `never` */
export async function createRawClient() {
  const c = await cookieHandler()
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const OWNER_ROLES = ['company_admin', 'company', 'admin', 'Admin', 'super_admin']
  return data.company_id ?? (OWNER_ROLES.includes(data.role ?? '') ? user.id : null)
}
