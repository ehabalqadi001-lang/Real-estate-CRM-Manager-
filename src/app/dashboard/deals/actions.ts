'use server'

import { revalidatePath } from 'next/cache'
import { notifyAdmins, notifyDealClosed } from '@/lib/notify'
import { createServerSupabaseClient } from '@/shared/supabase/server'

interface DealPayload {
  leadId: string
  unitId?: string
  agentId: string
  finalPrice: number
  commissionRate: number
  discount?: number
}

export async function closeDeal(payload: DealPayload) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول أولاً')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = profile?.company_id || user.id
  const { data: lead } = await supabase
    .from('leads')
    .select('client_name, full_name')
    .eq('id', payload.leadId)
    .single()

  const clientName = lead?.full_name || lead?.client_name || 'عميل'

  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .insert({
      title: `صفقة ${clientName}`,
      lead_id: payload.leadId,
      unit_id: payload.unitId,
      agent_id: payload.agentId,
      company_id: companyId,
      final_price: payload.finalPrice,
      unit_value: payload.finalPrice,
      value: payload.finalPrice,
      discount: payload.discount || 0,
      stage: 'contract_signed',
      status: 'won',
    })
    .select()
    .single()

  if (dealError) throw new Error(dealError.message)

  const commissionAmount = payload.finalPrice * (payload.commissionRate / 100)
  const { error: commissionError } = await supabase.from('commissions').insert({
    deal_id: deal.id,
    agent_id: payload.agentId,
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

  await supabase.from('leads').update({ status: 'Won' }).eq('id', payload.leadId)

  void notifyDealClosed(payload.agentId, clientName, payload.finalPrice, deal.id)
  void notifyAdmins('صفقة جديدة مغلقة', `${clientName} · ${payload.finalPrice.toLocaleString('ar-EG')} ج.م`, '/dashboard/deals')

  revalidatePath('/dashboard/deals')
  revalidatePath('/dashboard/leads')
  revalidatePath('/company/dashboard')
  return { success: true }
}
