'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { hasPermission, normalizeRole, type Role } from '@/lib/permissions'

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

type Actor = {
  id: string
  role: Role
  companyId: string | null
}

export async function updatePipelineDealStage(dealId: string, stage: string) {
  const supabase = await createServerSupabaseClient()
  const actor = await requirePermission(supabase, 'deals:write')
  await assertDealScope(supabase, actor, dealId)

  const { error } = await supabase
    .from('deals')
    .update({ stage })
    .eq('id', dealId)

  if (error) throw new Error(error.message)

  await supabase.from('deal_activities').insert({
    deal_id: dealId,
    user_id: actor.id,
    action: 'stage_changed',
    note: `تم نقل الصفقة إلى مرحلة ${stage}`,
  })

  revalidatePath('/dashboard/pipeline')
}

export async function createPipelineDeal(input: CreateDealInput) {
  const supabase = await createServerSupabaseClient()
  const actor = await requirePermission(supabase, 'deals:write')
  const canAssignAgents = hasPermission(actor.role, 'team:manage') || actor.role === 'senior_agent'
  const agentId = canAssignAgents && input.agentId ? input.agentId : actor.id

  if (agentId !== actor.id) await assertAgentInCompany(supabase, actor, agentId)

  const { data, error } = await supabase
    .from('deals')
    .insert({
      lead_id: input.leadId,
      unit_id: input.unitId || null,
      agent_id: agentId,
      company_id: actor.companyId ?? actor.id,
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
    user_id: actor.id,
    action: 'created',
    note: input.notes || 'تم إنشاء الصفقة',
  })

  revalidatePath('/dashboard/pipeline')
  return { id: data.id }
}

export async function updatePipelineDeal(input: UpdateDealInput) {
  const supabase = await createServerSupabaseClient()
  const actor = await requirePermission(supabase, 'deals:write')
  await assertDealScope(supabase, actor, input.dealId)

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

  await supabase.from('deal_activities').insert({
    deal_id: input.dealId,
    user_id: actor.id,
    action: 'updated',
    note: input.notes || 'تم تحديث بيانات الصفقة',
  })

  revalidatePath('/dashboard/pipeline')
}

export async function addDealActivity(dealId: string, note: string) {
  const supabase = await createServerSupabaseClient()
  const actor = await requirePermission(supabase, 'deals:write')
  await assertDealScope(supabase, actor, dealId)

  const { error } = await supabase.from('deal_activities').insert({
    deal_id: dealId,
    user_id: actor.id,
    action: 'note',
    note,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/pipeline')
}

async function requirePermission(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, permission: string): Promise<Actor> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول أولًا')

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role, company_id, status')
    .eq('id', user.id)
    .maybeSingle()

  const { data: legacyProfile } = userProfile ? { data: null } : await supabase
    .from('profiles')
    .select('role, company_id, status')
    .eq('id', user.id)
    .maybeSingle()

  const profile = userProfile ?? legacyProfile
  const role = normalizeRole(profile?.role ?? 'viewer')
  if (!profile || profile.status === 'suspended' || profile.status === 'rejected') throw new Error('الحساب غير نشط')
  if (!hasPermission(role, permission)) throw new Error('غير مصرح بهذا الإجراء')
  return { id: user.id, role, companyId: profile.company_id ?? null }
}

async function assertDealScope(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, actor: Actor, dealId: string) {
  const { data, error } = await supabase
    .from('deals')
    .select('id, agent_id, company_id')
    .eq('id', dealId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('الصفقة غير موجودة')
  if (actor.role === 'super_admin') return
  if (hasPermission(actor.role, 'team:manage') && data.company_id === actor.companyId) return
  if (data.agent_id === actor.id) return
  throw new Error('غير مصرح بتعديل هذه الصفقة')
}

async function assertAgentInCompany(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, actor: Actor, agentId: string) {
  if (actor.role === 'super_admin') return
  const { data } = await supabase
    .from('user_profiles')
    .select('id, company_id')
    .eq('id', agentId)
    .maybeSingle()

  if (!data || data.company_id !== actor.companyId) throw new Error('لا يمكن تعيين الصفقة لوكيل خارج شركتك')
}
