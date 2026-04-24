'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requirePermission } from '@/shared/rbac/require-permission'
import { requireSession } from '@/shared/auth/session'

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

export async function savePartnerCommissionException(formData: FormData) {
  await requirePermission('admin.view')
  const session = await requireSession()
  const service = createServiceRoleClient()

  const profileId = String(formData.get('profile_id') ?? '')
  const developerId = String(formData.get('developer_id') ?? '')
  const projectId = String(formData.get('project_id') ?? '') || null
  const developerRate = Number(formData.get('developer_commission_rate') ?? 0)
  const brokerRate = Number(formData.get('broker_commission_rate') ?? 0)
  const note = String(formData.get('note') ?? '') || null

  if (!profileId || !developerId) return

  await service.from('partner_commission_exceptions').upsert({
    profile_id: profileId,
    developer_id: developerId,
    project_id: projectId,
    developer_commission_rate: developerRate,
    broker_commission_rate: brokerRate,
    note,
    created_by: session.user.id,
  }, { onConflict: 'profile_id,developer_id,project_id' })

  revalidatePath('/admin/developers')
}

export async function deletePartnerCommissionException(formData: FormData) {
  await requirePermission('admin.view')
  const service = createServiceRoleClient()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await service.from('partner_commission_exceptions').delete().eq('id', id)
  revalidatePath('/admin/developers')
}
