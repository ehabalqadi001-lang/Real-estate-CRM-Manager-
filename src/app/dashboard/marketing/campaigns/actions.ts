'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function createCampaignAction(formData: FormData) {
  await requirePermission('messages.create')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const name       = formData.get('name') as string
  const department = formData.get('department') as string
  const goals      = formData.get('goals') as string
  const budget     = formData.get('budget_egp') as string
  const startDate  = formData.get('start_date') as string
  const endDate    = formData.get('end_date') as string

  if (!name || !department) return { error: 'اسم الحملة والقسم مطلوبان' }

  const { error } = await supabase.from('marketing_campaigns').insert({
    company_id: companyId,
    created_by: user.id,
    name,
    department,
    goals: goals || null,
    budget_egp: budget ? Number(budget) : null,
    start_date: startDate || null,
    end_date: endDate || null,
    status: 'draft',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/marketing/campaigns')
  revalidatePath('/dashboard/marketing')
  return { success: true }
}

export async function updateCampaignStatusAction(id: string, status: string) {
  await requirePermission('messages.create')
  const supabase = await createRawClient()
  const { error } = await supabase
    .from('marketing_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/marketing/campaigns')
  return { success: true }
}
