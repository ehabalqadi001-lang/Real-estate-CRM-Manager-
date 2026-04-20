'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/shared/supabase/server'

export type CreateDealInput = {
  leadId: string
  unitId?: string | null
  agentId?: string | null
  title: string
  value: number
  expectedCloseDate?: string | null
  notes?: string | null
}

export type UpdateDealInput = {
  dealId: string
  stage?: string
  value?: number
  expectedCloseDate?: string | null
  notes?: string | null
}

export async function updatePipelineDealStage(dealId: string, stage: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('deals')
    .update({ stage })
    .eq('id', dealId)

  if (error) throw new Error(error.message)

  if (user) {
    await supabase.from('deal_activities').insert({
      deal_id: dealId,
      user_id: user.id,
      action: 'stage_changed',
      note: `تم نقل الصفقة إلى مرحلة ${stage}`,
    })
  }

  revalidatePath('/dashboard/pipeline')
}

export async function createPipelineDeal(input: CreateDealInput) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول أولا')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .maybeSingle()

  const companyId = profile?.company_id ?? user.id
  const agentId = input.agentId || user.id

  const { data, error } = await supabase
    .from('deals')
    .insert({
      lead_id: input.leadId,
      unit_id: input.unitId || null,
      agent_id: agentId,
      company_id: companyId,
      stage: 'new',
      title: input.title,
      value: input.value,
      unit_value: input.value,
      expected_close_date: input.expectedCloseDate || null,
      notes: input.notes || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('deal_activities').insert({
    deal_id: data.id,
    user_id: user.id,
    action: 'created',
    note: input.notes || 'تم إنشاء الصفقة',
  })

  revalidatePath('/dashboard/pipeline')
  return { id: data.id }
}

export async function updatePipelineDeal(input: UpdateDealInput) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const update: {
    stage?: string
    value?: number
    unit_value?: number
    expected_close_date?: string | null
    notes?: string | null
  } = {}
  if (input.stage) update.stage = input.stage
  if (typeof input.value === 'number') {
    update.value = input.value
    update.unit_value = input.value
  }
  if (input.expectedCloseDate !== undefined) update.expected_close_date = input.expectedCloseDate
  if (input.notes !== undefined) update.notes = input.notes

  const { error } = await supabase
    .from('deals')
    .update(update)
    .eq('id', input.dealId)

  if (error) throw new Error(error.message)

  if (user) {
    await supabase.from('deal_activities').insert({
      deal_id: input.dealId,
      user_id: user.id,
      action: 'updated',
      note: input.notes || 'تم تحديث بيانات الصفقة',
    })
  }

  revalidatePath('/dashboard/pipeline')
}

export async function addDealActivity(dealId: string, note: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول أولا')

  const { error } = await supabase.from('deal_activities').insert({
    deal_id: dealId,
    user_id: user.id,
    action: 'note',
    note,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/pipeline')
}
