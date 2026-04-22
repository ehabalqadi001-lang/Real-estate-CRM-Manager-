'use server'

import { revalidatePath } from 'next/cache'
import { notifyAdmins, notifyDealClosed } from '@/lib/notify'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { getActiveCompanyContext } from '@/shared/company-context/server'
import { nullableUuid } from '@/lib/uuid'

interface DealPayload {
  leadId: string
  unitId?: string | null
  agentId: string
  finalPrice: number
  commissionRate: number
  discount?: number
}

export async function closeDeal(payload: DealPayload) {
  const session = await requireSession()
  const companyContext = await getActiveCompanyContext(session)
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('يجب تسجيل الدخول أولاً')

  const leadId = nullableUuid(payload.leadId)
  const agentId = nullableUuid(payload.agentId)
  const unitId = nullableUuid(payload.unitId)

  if (!leadId) throw new Error('اختر عميلاً صحيحاً قبل توثيق الصفقة.')
  if (!agentId) throw new Error('اختر وكيلاً صحيحاً قبل توثيق الصفقة.')
  if (!Number.isFinite(payload.finalPrice) || payload.finalPrice <= 0) throw new Error('قيمة العقد غير صحيحة.')
  if (!Number.isFinite(payload.commissionRate) || payload.commissionRate <= 0) throw new Error('نسبة العمولة غير صحيحة.')

  const [{ data: profile }, { data: lead, error: leadError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('company_id, tenant_id')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('leads')
      .select('client_name, full_name, company_id')
      .eq('id', leadId)
      .maybeSingle(),
  ])

  if (leadError) throw new Error(leadError.message)
  if (!lead) throw new Error('لم يتم العثور على العميل المحدد.')

  const companyId =
    nullableUuid(companyContext.companyId) ??
    nullableUuid(profile?.company_id) ??
    nullableUuid(profile?.tenant_id) ??
    nullableUuid(lead.company_id)

  if (!companyId) {
    throw new Error('لا يمكن توثيق الصفقة قبل ربط العميل أو حسابك بشركة صالحة.')
  }

  const clientName = lead.full_name || lead.client_name || 'عميل'

  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .insert({
      title: `صفقة ${clientName}`,
      lead_id: leadId,
      unit_id: unitId,
      agent_id: agentId,
      company_id: companyId,
      final_price: payload.finalPrice,
      unit_value: payload.finalPrice,
      value: payload.finalPrice,
      discount: payload.discount || 0,
      stage: 'contract_signed',
      status: 'won',
      contract_signed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (dealError) throw new Error(dealError.message)

  const commissionAmount = payload.finalPrice * (payload.commissionRate / 100)
  const { error: commissionError } = await supabase.from('commissions').insert({
    deal_id: deal.id,
    agent_id: agentId,
    company_id: companyId,
    amount: commissionAmount,
    total_amount: commissionAmount,
    deal_value: payload.finalPrice,
    percentage: payload.commissionRate,
    commission_rate: payload.commissionRate,
    gross_deal_value: payload.finalPrice,
    gross_commission: commissionAmount,
    agent_amount: commissionAmount,
    company_amount: 0,
    status: 'pending',
  })

  if (commissionError) throw new Error(commissionError.message)

  await supabase.from('leads').update({ status: 'Won', company_id: companyId }).eq('id', leadId)

  void notifyDealClosed(agentId, clientName, payload.finalPrice, deal.id)
  void notifyAdmins(
    'صفقة جديدة مغلقة',
    `${clientName} · ${payload.finalPrice.toLocaleString('ar-EG')} ج.م`,
    '/dashboard/deals',
  )

  revalidatePath('/dashboard/deals')
  revalidatePath('/dashboard/leads')
  revalidatePath('/company/dashboard')

  return { success: true }
}
