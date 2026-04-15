'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// دالة إغلاق الصفقة وحساب العمولات أوتوماتيكياً
export async function closeDeal(payload: any) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 1. تسجيل الصفقة في جدول الصفقات
  const { data: deal, error: dealError } = await supabase.from('deals').insert({
    lead_id: payload.leadId,
    unit_id: payload.unitId,
    agent_id: payload.agentId,
    final_price: payload.finalPrice,
    discount: payload.discount || 0,
    stage: 'contract_signed'
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
  await supabase.from('leads').update({ status: 'Won' }).eq('id', payload.leadId)

  revalidatePath('/dashboard/leads')
  revalidatePath('/company/dashboard')
  return { success: true }
}