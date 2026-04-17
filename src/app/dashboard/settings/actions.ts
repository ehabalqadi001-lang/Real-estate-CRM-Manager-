'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function saveCompanySettings(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مخوّل')

  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const payload: Record<string, unknown> = {
    company_name: formData.get('company_name') || null,
    phone:        formData.get('phone') || null,
  }

  // Update the company owner's profile (which acts as the company record)
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', companyId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/settings')
}

export async function getCompanySettings() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const { data } = await supabase
    .from('profiles')
    .select('company_name, phone, full_name')
    .eq('id', companyId)
    .single()

  return data
}
