import { createRawClient } from '@/lib/supabase/server'
import type { AppProfile } from '@/shared/auth/types'

export interface FeatureFlag {
  id: string
  flag_key: string
  label: string
  description: string | null
  enabled_roles: string[]
  enabled_companies: string[]
  is_global: boolean
}

export async function getAllFlags(): Promise<FeatureFlag[]> {
  const supabase = await createRawClient()
  const { data } = await supabase.from('feature_flags').select('*').order('label')
  return (data ?? []) as FeatureFlag[]
}

export async function hasFlag(flagKey: string, profile: AppProfile): Promise<boolean> {
  const supabase = await createRawClient()
  const { data } = await supabase
    .from('feature_flags')
    .select('is_global, enabled_roles, enabled_companies')
    .eq('flag_key', flagKey)
    .single()

  if (!data) return false
  if (data.is_global) return true
  if (profile.role && data.enabled_roles?.includes(profile.role)) return true
  if (profile.company_id && data.enabled_companies?.includes(profile.company_id)) return true
  return false
}
