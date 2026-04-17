'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { notifyDealClosed, notifyAdmins } from '@/lib/notify'

// دالة إغلاق الصفقة وحساب العمولات أوتوماتيكياً
interface DealPayload {
  leadId: string
  unitId?: string
  agentId: string
  finalPrice: number
  commissionRate: number
  discount?: number
}

export async function closeDeal(payload: DealPayload) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id || user.id

  // 1. تسجيل الصفقة في جدول الصفقات
  const { data: deal, error: dealError } = await supabase.from('deals').insert({
    lead_id:    payload.leadId,
    unit_id:    payload.unitId,
    agent_id:   payload.agentId,
    company_id: companyId,
    final_price: payload.finalPrice,
    discount:   payload.discount || 0,
    stage:      'contract_signed'
  }).select().single()

  if (dealError) throw new Error(dealError.message)

  // 2. حساب وتوليد مطالبة العمولة للوكيل
  const commissionAmount = (payload.finalPrice * (payload.commissionRate / 100))
  
  await supabase.from('commissions').insert({
    deal_id: deal.id,
    agent_id: payload.agentId,
    amount: commissionAmount,
    rate: payload.commissionRate,
    status: 'pending'
  })

  // 3. تحديث حالة العميل إلى "تم البيع" (Won)
  const { data: lead } = await supabase.from('leads').select('client_name, full_name').eq('id', payload.leadId).single()
  await supabase.from('leads').update({ status: 'Won' }).eq('id', payload.leadId)

  const clientName = lead?.full_name || lead?.client_name || 'عميل'
  void notifyDealClosed(payload.agentId, clientName, payload.finalPrice, deal.id)
  void notifyAdmins('صفقة جديدة مغلقة', `${clientName} · ${payload.finalPrice.toLocaleString()} ج.م`, '/dashboard/deals')

  revalidatePath('/dashboard/leads')
  revalidatePath('/company/dashboard')
  return { success: true }
}