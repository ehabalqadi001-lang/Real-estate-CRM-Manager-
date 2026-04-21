'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function saveDeveloper(formData: FormData) {
  await requirePermission('admin.view')
  const id = String(formData.get('id') ?? '')
  const supabase = await createRawClient()
  const payload = {
    name: String(formData.get('name') ?? ''),
    name_ar: String(formData.get('name_ar') ?? ''),
    phone: String(formData.get('phone') ?? '') || null,
    email: String(formData.get('email') ?? '') || null,
    website: String(formData.get('website') ?? '') || null,
    tier: String(formData.get('tier') ?? 'standard'),
    active: formData.get('active') === 'on',
  }
  if (id) await supabase.from('developers').update(payload).eq('id', id)
  else await supabase.from('developers').insert(payload)
  revalidatePath('/admin/developers')
}

export async function saveCommissionRate(formData: FormData) {
  await requirePermission('admin.view')
  const supabase = await createRawClient()
  await supabase.from('commission_rates').insert({
    developer_id: String(formData.get('developer_id') ?? ''),
    project_id: String(formData.get('project_id') ?? '') || null,
    min_value: Number(formData.get('min_value') ?? 0),
    max_value: String(formData.get('max_value') ?? '') ? Number(formData.get('max_value')) : null,
    rate_percentage: Number(formData.get('rate_percentage') ?? 0),
    agent_share_percentage: Number(formData.get('agent_share_percentage') ?? 70),
    company_share_percentage: Number(formData.get('company_share_percentage') ?? 30),
  })
  revalidatePath('/admin/developers')
}
