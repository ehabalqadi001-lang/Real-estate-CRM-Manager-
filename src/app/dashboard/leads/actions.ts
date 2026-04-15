'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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

  const { error } = await supabase.from('leads').insert({ 
    client_name: name || 'عميل جديد', 
    phone: phone || null,
    email: email || null,
    property_type: property_type || 'غير محدد', 
    expected_value: expected_value || 0, 
    status: 'Fresh Leads',
    user_id: user.id,
    company_id: targetCompanyId 
  })

  if (error) return { success: false, error: error.message }
  
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
  const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
  return { success: true }
}

// 4. تقارير المتابعة
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