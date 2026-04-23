'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { notifyLeadAssigned, notifyLeadStatusChanged, notifyAdmins } from '@/lib/notify'
import { recalculateLeadScore } from './scoring'

// 1. الرادار الذكي (يجلب العملاء الجدد والقدامى)
export async function getLeads() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase.from('profiles').select('role, account_type, company_id').eq('id', user.id).single()
  const isCompany = profile?.role === 'company_admin' || profile?.account_type === 'company'
  
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

  if (isCompany) {
    // عبقرية التوافق: جلب عملاء الشركة أو العملاء الذين سجلهم المدير قديماً
    query = query.or(`company_id.eq.${user.id},user_id.eq.${user.id}`)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

// محرك الإضافة المضاد للرصاص
interface LeadPayload {
  clientName?: string
  name?: string
  phone?: string
  email?: string
  propertyType?: string
  expectedValue?: number
}

function isFormData(p: LeadPayload | FormData): p is FormData {
  return typeof (p as FormData).get === 'function'
}

export async function addLead(payload: LeadPayload | FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const fd = isFormData(payload)
  const name = fd ? (payload.get('clientName') || payload.get('name')) as string : (payload.clientName || payload.name)
  const phone = fd ? payload.get('phone') as string : payload.phone
  const email = fd ? payload.get('email') as string : payload.email
  const property_type = fd ? payload.get('propertyType') as string : payload.propertyType
  const expected_value = fd ? Number(payload.get('expectedValue')) : Number(payload.expectedValue)

  // جلب الملف الشخصي ببساطة
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  
  // 🔥 الحل السحري الجذري: 
  // إذا كان حسابه مربوطاً بشركة (وكيل) نستخدم ختم الشركة، وإذا لم يكن (لأنه هو المدير نفسه) نستخدم ختمه الشخصي.
  const targetCompanyId = profile?.company_id ? profile.company_id : user.id

  const leadName = String(name || 'عميل جديد').trim()
  const normalizedPhone = String(phone ?? '').replace(/\s+/g, '').trim()
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  const duplicateWindow = new Date(Date.now() - 2 * 60 * 1000).toISOString()

  let duplicateQuery = supabase
    .from('leads')
    .select('id')
    .eq('company_id', targetCompanyId)
    .gte('created_at', duplicateWindow)
    .limit(1)

  if (normalizedPhone) {
    duplicateQuery = duplicateQuery.eq('phone', normalizedPhone)
  } else if (normalizedEmail) {
    duplicateQuery = duplicateQuery.eq('email', normalizedEmail)
  } else {
    duplicateQuery = duplicateQuery.eq('client_name', leadName)
  }

  const { data: duplicateLead } = await duplicateQuery.maybeSingle()
  if (duplicateLead?.id) {
    revalidatePath('/dashboard/leads')
    return { success: true, duplicate: true }
  }

  const { data: inserted, error } = await supabase.from('leads').insert({
    client_name: leadName,
    phone: normalizedPhone || null,
    email: normalizedEmail || null,
    property_type: property_type || 'غير محدد',
    expected_value: expected_value || 0,
    status: 'Fresh Leads',
    user_id: user.id,
    company_id: targetCompanyId,
  }).select('id').single()

  if (error) return { success: false, error: error.message }

  // Notify admins about new lead
  void notifyAdmins(
    'عميل محتمل جديد',
    `${leadName} — أضافه ${user.email}`,
    inserted?.id ? `/dashboard/leads/${inserted.id}` : '/dashboard/leads'
  )

  revalidatePath('/dashboard/leads')
  return { success: true }
}

// 3. تحديث حالة العميل
export async function updateLeadStatus(leadId: string, newStatus: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  // Fetch lead to get name + assigned agent before update
  const { data: lead } = await supabase.from('leads').select('client_name, full_name, user_id, assigned_to').eq('id', leadId).single()
  const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId)
  if (error) throw new Error(error.message)

  const leadName = lead?.full_name || lead?.client_name || 'عميل'
  const agentId  = lead?.assigned_to || lead?.user_id
  if (agentId) {
    void notifyLeadStatusChanged(agentId, leadName, newStatus, leadId)
  }

  revalidatePath('/dashboard/leads')
  return { success: true }
}

// Assign lead to agent
export async function assignLead(leadId: string, agentId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data: lead } = await supabase.from('leads').select('client_name, full_name').eq('id', leadId).single()
  const { error } = await supabase.from('leads').update({ assigned_to: agentId }).eq('id', leadId)
  if (error) throw new Error(error.message)

  void notifyLeadAssigned(agentId, lead?.full_name || lead?.client_name || 'عميل', leadId)
  revalidatePath('/dashboard/leads')
  return { success: true }
}

// 4. سجل الأنشطة
export async function addLeadActivity(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const durationRaw = formData.get('duration_min') as string
  const { error } = await supabase.from('lead_activities').insert({
    lead_id:      formData.get('lead_id') as string,
    user_id:      user.id,
    type:         formData.get('type') as string,
    outcome:      (formData.get('outcome') as string) || null,
    note:         (formData.get('note') as string) || null,
    duration_min: durationRaw ? parseInt(durationRaw) : null,
  })
  if (error) throw new Error(error.message)
  const leadId = formData.get('lead_id') as string
  void recalculateLeadScore(leadId)
  revalidatePath(`/dashboard/leads/${leadId}`)
}

// WhatsApp send log
export async function logWhatsAppSend(leadId: string, phone: string, message: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  await supabase.from('whatsapp_logs').insert({
    lead_id:      leadId,
    client_phone: phone,
    message_body: message,
    status:       'sent',
  })
  revalidatePath(`/dashboard/leads/${leadId}`)
}

// 5. تقارير المتابعة
export async function addLeadReport(leadId: string, reportText: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('lead_reports').insert({ lead_id: leadId, user_id: user?.id, report_text: reportText || 'تحديث' })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
  return { success: true }
}
