'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'
import { encrypt } from '@/lib/crypto'

export async function saveApiKey(formData: FormData) {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const keyName = (formData.get('key_name') as string)?.trim()
  const value   = (formData.get('value') as string)?.trim()

  if (!keyName || !value) return { error: 'اسم المفتاح والقيمة مطلوبان' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = profile?.company_id ?? user.id

  const encrypted = encrypt(value)
  const hint = value.length > 4 ? `...${value.slice(-4)}` : '****'

  const { error } = await supabase
    .from('company_api_keys')
    .upsert({
      company_id: companyId,
      key_name: keyName,
      encrypted_value: encrypted,
      hint,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,key_name' })

  if (error) return { error: error.message }
  revalidatePath('/admin/api-vault')
  return { success: true }
}

export async function deleteApiKey(keyId: string) {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { error } = await supabase.from('company_api_keys').delete().eq('id', keyId)
  if (error) return { error: error.message }
  revalidatePath('/admin/api-vault')
  return { success: true }
}
