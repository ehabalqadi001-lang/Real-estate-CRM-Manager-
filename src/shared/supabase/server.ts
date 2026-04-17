// Canonical re-export — source of truth is src/lib/supabase/server.ts
export {
  createServerClient,
  createRawClient,
  getSession,
  getProfile,
  getCompanyId,
} from '@/lib/supabase/server'

// Alias for legacy callers
export { createServerClient as createServerSupabaseClient } from '@/lib/supabase/server'

