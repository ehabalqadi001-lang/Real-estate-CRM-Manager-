import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type CookieStore = Awaited<ReturnType<typeof cookies>>

function createServerSupabaseClient(cookieStore: CookieStore) {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server Components cannot set cookies directly. Proxy refreshes sessions.
          }
        },
      },
    },
  )
}

export function createClient(cookieStore: CookieStore): ReturnType<typeof createServerSupabaseClient>
export function createClient(): Promise<ReturnType<typeof createServerSupabaseClient>>
export function createClient(cookieStore?: CookieStore) {
  if (cookieStore) return createServerSupabaseClient(cookieStore)
  return cookies().then((store) => createServerSupabaseClient(store))
}
