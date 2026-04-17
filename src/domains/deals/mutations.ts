'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { getCompanyId } from '@/lib/supabase/server'
import {
  CreateDealFromLeadSchema,
  UpdateDealStageSchema,
  type CreateDealFromLeadInput,
  type UpdateDealStageInput,
  DEAL_STAGE_PROBABILITY,
} from './types'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── إنشاء صفقة من عميل محتمل ────────────────────────────────────────
export async function createDealFromLead(
  raw: CreateDealFromLeadInput
): Promise<ActionResult<{ id: string; stage: string }>> {
  await requireSession()

  const parsed = CreateDealFromLeadSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' }
  }

  const input = parsed.data
  const supabase = await createServerClient()
  const company_id = await getCompanyId()
  if (!company_id) return { success: false, error: 'لم يتم التعرف على الشركة' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'غير مسموح' }

  // تحقق من أن العميل المحتمل ينتمي لنفس الشركة
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('id, client_name, status, company_id')
    .eq('id', input.lead_id)
    .single()

  if (leadErr || !lead) {
    return { success: false, error: 'العميل المحتمل غير موجود' }
  }

  // تحقق من عدم وجود صفقة مفتوحة لنفس العميل
  const { data: existingDeal } = await supabase
    .from('deals')
    .select('id, stage')
    .eq('lead_id', input.lead_id)
    .not('stage', 'in', '("closed_won","closed_lost")')
    .maybeSingle()

  if (existingDeal) {
    return {
      success: false,
      error: `يوجد بالفعل صفقة مفتوحة لهذا العميل (المرحلة: ${existingDeal.stage})`,
    }
  }

  // إنشاء الصفقة
  const { data: deal, error: dealErr } = await supabase
    .from('deals')
    .insert({
      lead_id: input.lead_id,
      unit_id: input.unit_id ?? null,
      agent_id: user.id,
      company_id,
      stage: input.stage,
      unit_value: input.unit_value ?? null,
      notes: input.notes ?? null,
      expected_close_date: input.expected_close_date ?? null,
      probability: input.probability ?? DEAL_STAGE_PROBABILITY[input.stage],
      source: input.source ?? lead.client_name,
    })
    .select('id, stage')
    .single()

  if (dealErr || !deal) {
    return { success: false, error: dealErr?.message ?? 'فشل إنشاء الصفقة' }
  }

  // تحديث حالة العميل المحتمل إلى "في التفاوض"
  await supabase
    .from('leads')
    .update({ status: 'negotiating' })
    .eq('id', input.lead_id)

  // إنشاء workflow الموافقة تلقائيًا
  const { error: approvalErr } = await supabase.rpc('create_deal_approval_workflow', {
    p_deal_id: deal.id,
    p_company_id: company_id,
  })
  if (approvalErr) {
    // غير حرج — الصفقة تُنشأ بدون workflow إذا فشل
    console.error('Deal approval workflow failed:', approvalErr.message)
  }

  revalidatePath('/dashboard/deals')
  revalidatePath(`/dashboard/leads/${input.lead_id}`)

  return { success: true, data: deal }
}

// ─── تحديث مرحلة الصفقة ──────────────────────────────────────────────
export async function updateDealStage(
  raw: UpdateDealStageInput
): Promise<ActionResult<{ id: string; stage: string }>> {
  await requireSession()

  const parsed = UpdateDealStageSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' }
  }

  const { deal_id, stage, notes } = parsed.data
  const supabase = await createServerClient()
  const company_id = await getCompanyId()

  const { data, error } = await supabase
    .from('deals')
    .update({
      stage,
      probability: DEAL_STAGE_PROBABILITY[stage],
      notes: notes ?? undefined,
      ...(stage === 'closed_won' ? { actual_close_date: new Date().toISOString().split('T')[0] } : {}),
    })
    .eq('id', deal_id)
    .eq('company_id', company_id)
    .select('id, stage')
    .single()

  if (error || !data) {
    return { success: false, error: error?.message ?? 'فشل تحديث مرحلة الصفقة' }
  }

  revalidatePath('/dashboard/deals')
  revalidatePath('/dashboard/deals/kanban')

  return { success: true, data }
}

// ─── حجز وحدة لصفقة ───────────────────────────────────────────────────
export async function reserveUnitForDeal(
  dealId: string,
  unitId: string,
  clientName: string,
  clientPhone: string,
): Promise<ActionResult<{ reservation_id: string }>> {
  await requireSession()

  const supabase = await createServerClient()
  const company_id = await getCompanyId()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !company_id) return { success: false, error: 'غير مسموح' }

  // تحقق من إتاحة الوحدة
  const { data: unit } = await supabase
    .from('inventory')
    .select('id, status, unit_name')
    .eq('id', unitId)
    .single()

  if (!unit || unit.status !== 'available') {
    return { success: false, error: `الوحدة ${unit?.unit_name ?? ''} غير متاحة للحجز` }
  }

  // إنشاء الحجز
  const { data: reservation, error: resErr } = await supabase
    .from('unit_reservations')
    .insert({
      unit_id: unitId,
      deal_id: dealId,
      company_id,
      reserved_by: user.id,
      client_name: clientName,
      client_phone: clientPhone,
    })
    .select('id')
    .single()

  if (resErr || !reservation) {
    return { success: false, error: resErr?.message ?? 'فشل الحجز' }
  }

  // ربط الوحدة بالصفقة
  await supabase
    .from('deals')
    .update({ unit_id: unitId, stage: 'reservation' })
    .eq('id', dealId)

  revalidatePath('/dashboard/deals')
  revalidatePath('/dashboard/inventory/units')

  return { success: true, data: { reservation_id: reservation.id } }
}

// ─── الموافقة على صفقة ────────────────────────────────────────────────
export async function approveDeal(
  approvalId: string,
  notes?: string
): Promise<ActionResult<{ approved: boolean }>> {
  await requireSession()

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'غير مسموح' }

  const { error } = await supabase
    .from('deal_approvals')
    .update({
      status: 'approved',
      approved_by: user.id,
      decided_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq('id', approvalId)
    .eq('approver_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/deals')
  return { success: true, data: { approved: true } }
}

// ─── رفض صفقة ─────────────────────────────────────────────────────────
export async function rejectDeal(
  approvalId: string,
  notes: string
): Promise<ActionResult<{ rejected: boolean }>> {
  await requireSession()

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'غير مسموح' }

  const { error } = await supabase
    .from('deal_approvals')
    .update({
      status: 'rejected',
      approved_by: user.id,
      decided_at: new Date().toISOString(),
      notes,
    })
    .eq('id', approvalId)
    .eq('approver_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/deals')
  return { success: true, data: { rejected: true } }
}
