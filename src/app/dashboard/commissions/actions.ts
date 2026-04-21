'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { sendNotification } from '@/lib/notify'
import { hasPermission, normalizeRole, type Role } from '@/lib/permissions'

export type CommissionRequestInput = {
  commissionId: string
  paymentMethod: string
  bankDetails?: string
  paymentReference?: string
  receiptUrl?: string
}

type Actor = {
  id: string
  role: Role
  companyId: string | null
}

export async function requestCommissionPayout(input: CommissionRequestInput) {
  const supabase = await createServerSupabaseClient()
  const actor = await requirePermission(supabase, 'commissions:write')
  const commission = await getCommissionScope(supabase, input.commissionId)

  if (actor.role !== 'super_admin' && actor.companyId !== commission.companyId && actor.id !== commission.agentId) {
    throw new Error('غير مصرح بطلب صرف هذه العمولة')
  }

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

  const admins = await getCommissionAdmins(supabase, commission.companyId)
  await Promise.all(admins.map((adminId) => sendNotification({
    userId: adminId,
    type: 'commission_paid',
    title: 'طلب صرف عمولة جديد',
    body: 'يوجد طلب صرف عمولة يحتاج مراجعة واعتماد.',
    link: '/dashboard/commissions',
  })))

  revalidateCommissions()
}

export async function approveCommission(commissionId: string) {
  const supabase = await createServerSupabaseClient()
  const actor = await requirePermission(supabase, 'commissions:approve')
  const commission = await getCommissionScope(supabase, commissionId)

  if (actor.role !== 'super_admin' && actor.companyId !== commission.companyId) {
    throw new Error('غير مصرح باعتماد هذه العمولة')
  }

  const { error } = await supabase
    .from('commissions')
    .update({
      status: 'approved',
      approved_by: actor.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', commissionId)

  if (error) throw new Error(error.message)
  revalidateCommissions()
}

export async function markCommissionPaid(commissionId: string, paymentReference?: string) {
  const supabase = await createServerSupabaseClient()
  const actor = await requirePermission(supabase, 'commissions:approve')
  const commission = await getCommissionScope(supabase, commissionId)

  if (actor.role !== 'super_admin' && actor.companyId !== commission.companyId) {
    throw new Error('غير مصرح بصرف هذه العمولة')
  }

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
  revalidateCommissions()
}

export async function payCommission(commissionId: string) {
  await markCommissionPaid(commissionId)
}

export async function addCommission(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const actor = await requirePermission(supabase, 'commissions:approve')
  const payload = {
    deal_id: formData.get('deal_id') || null,
    agent_id: formData.get('member_id') || null,
    company_id: actor.companyId ?? actor.id,
    amount: Number(formData.get('amount') || 0),
    total_amount: Number(formData.get('amount') || 0),
    gross_commission: Number(formData.get('amount') || 0),
    agent_amount: Number(formData.get('amount') || 0),
    commission_type: formData.get('commission_type') || 'agent',
    status: formData.get('status') || 'pending',
  }
  const { error } = await supabase.from('commissions').insert([payload])
  if (error) throw new Error(error.message)
  revalidateCommissions()
}

export async function getActiveDeals() {
  const supabase = await createServerSupabaseClient()
  await requirePermission(supabase, 'deals:read')
  const { data } = await supabase.from('deals').select('id, title, unit_value, value').neq('status', 'lost')
  return data || []
}

export async function getActiveTeam() {
  const supabase = await createServerSupabaseClient()
  const actor = await requirePermission(supabase, 'team:read')
  let query = supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('role', ['agent', 'senior_agent', 'branch_manager'])
    .limit(300)

  if (actor.companyId && actor.role !== 'super_admin') query = query.eq('company_id', actor.companyId)
  const { data } = await query
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
  const actor = await requirePermission(supabase, 'deals:write')

  const { data, error } = await supabase
    .from('deals')
    .insert({
      lead_id: input.leadId || null,
      unit_id: input.unitId || null,
      agent_id: actor.id,
      company_id: actor.companyId ?? actor.id,
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

async function getCommissionScope(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, commissionId: string) {
  const { data, error } = await supabase
    .from('commissions')
    .select('id, agent_id, company_id')
    .eq('id', commissionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('العمولة غير موجودة')
  return {
    agentId: data.agent_id ?? null,
    companyId: data.company_id ?? null,
  }
}

async function getCommissionAdmins(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, companyId: string | null) {
  const [{ data: userProfileAdmins }, { data: legacyAdmins }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, role, company_id')
      .in('role', ['super_admin', 'company_admin'])
      .limit(300),
    supabase
      .from('profiles')
      .select('id, role, company_id')
      .in('role', ['super_admin', 'admin', 'company_admin', 'company', 'finance_manager', 'finance_officer'])
      .limit(300),
  ])

  return Array.from(new Set([...(userProfileAdmins ?? []), ...(legacyAdmins ?? [])]
    .filter((admin) => admin.role === 'super_admin' || !companyId || admin.company_id === companyId)
    .map((admin) => admin.id)))
}

function revalidateCommissions() {
  revalidatePath('/dashboard/commissions')
  revalidatePath('/dashboard/commissions/history')
}
