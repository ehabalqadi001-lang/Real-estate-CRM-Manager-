'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function toggleFlagGlobal(flagId: string, value: boolean) {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { error } = await supabase
    .from('feature_flags')
    .update({ is_global: value, updated_at: new Date().toISOString() })
    .eq('id', flagId)
  if (error) return { error: error.message }
  revalidatePath('/admin/feature-flags')
  return { success: true }
}

export async function toggleFlagRole(flagId: string, role: string, enable: boolean) {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { data } = await supabase.from('feature_flags').select('enabled_roles').eq('id', flagId).single()
  if (!data) return { error: 'Flag not found' }

  const roles: string[] = data.enabled_roles ?? []
  const updated = enable
    ? [...new Set([...roles, role])]
    : roles.filter((r: string) => r !== role)

  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled_roles: updated, updated_at: new Date().toISOString() })
    .eq('id', flagId)
  if (error) return { error: error.message }
  revalidatePath('/admin/feature-flags')
  return { success: true }
}

export async function toggleFlagCompany(flagId: string, companyId: string, enable: boolean) {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { data } = await supabase.from('feature_flags').select('enabled_companies').eq('id', flagId).single()
  if (!data) return { error: 'Flag not found' }

  const companies: string[] = data.enabled_companies ?? []
  const updated = enable
    ? [...new Set([...companies, companyId])]
    : companies.filter((c: string) => c !== companyId)

  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled_companies: updated, updated_at: new Date().toISOString() })
    .eq('id', flagId)
  if (error) return { error: error.message }
  revalidatePath('/admin/feature-flags')
  return { success: true }
}
