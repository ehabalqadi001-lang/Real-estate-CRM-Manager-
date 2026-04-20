'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { sendNotification } from '@/lib/notify'

export type CommissionRequestInput = {
  commissionId: string
  paymentMethod: string
  bankDetails?: string
  paymentReference?: string
  receiptUrl?: string
}

export async function requestCommissionPayout(input: CommissionRequestInput) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول أولا')

  const { error } = await supabase
    .from('commissions')
    .update({
      status: 'processing',
      payment_method: input.paymentMethod,
      bank_details: input.bankDetails || null,
      payment_reference: input.paymentReference || null,
      receipt_url: input.receiptUrl || null,
      requested_at: new Date().toISOString(),
    })
    .eq('id', input.commissionId)

  if (error) throw new Error(error.message)

  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['super_admin', 'admin', 'company_admin', 'company', 'finance_manager', 'finance_officer'])

  await Promise.all((admins ?? []).map((admin) => sendNotification({
    userId: admin.id,
    type: 'commission_paid',
    title: 'طلب صرف عمولة جديد',
    body: 'يوجد طلب صرف عمولة يحتاج مراجعة واعتماد.',
    link: '/dashboard/commissions',
  })))

  revalidatePath('/dashboard/commissions')
  revalidatePath('/dashboard/commissions/history')
}

export async function approveCommission(commissionId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول أولا')

  const { error } = await supabase
    .from('commissions')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', commissionId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/commissions')
}

export async function markCommissionPaid(commissionId: string, paymentReference?: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('commissions')
    .update({
      status: 'paid',
      payment_reference: paymentReference || null,
      payment_date: new Date().toISOString().slice(0, 10),
      paid_at: new Date().toISOString(),
    })
    .eq('id', commissionId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/commissions')
  revalidatePath('/dashboard/commissions/history')
}

export async function payCommission(commissionId: string) {
  await markCommissionPaid(commissionId)
}

export async function addCommission(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const payload = {
    deal_id: formData.get('deal_id') || null,
    agent_id: formData.get('member_id') || null,
    amount: Number(formData.get('amount') || 0),
    total_amount: Number(formData.get('amount') || 0),
    gross_commission: Number(formData.get('amount') || 0),
    agent_amount: Number(formData.get('amount') || 0),
    commission_type: formData.get('commission_type') || 'agent',
    status: formData.get('status') || 'pending',
  }
  const { error } = await supabase.from('commissions').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/commissions')
}

export async function getActiveDeals() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('deals').select('id, title, unit_value, value').neq('status', 'lost')
  return data || []
}

export async function getActiveTeam() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('profiles').select('id, full_name').in('role', ['agent', 'broker', 'senior_agent'])
  return (data || []).map((row) => ({ id: row.id, name: row.full_name ?? 'عضو فريق' }))
}

export async function createDealFromCalculator(input: {
  leadId?: string | null
  projectId?: string | null
  unitId?: string | null
  value: number
  title: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('يجب تسجيل الدخول أولا')

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
  const { data, error } = await supabase
    .from('deals')
    .insert({
      lead_id: input.leadId || null,
      unit_id: input.unitId || null,
      agent_id: user.id,
      company_id: profile?.company_id ?? user.id,
      title: input.title,
      value: input.value,
      unit_value: input.value,
      stage: 'new',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/pipeline')
  return { id: data.id }
}
