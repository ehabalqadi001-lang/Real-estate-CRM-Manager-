'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. جلب جميع العملاء
export async function getLeads() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// 2. تحديث حالة العميل عند السحب والإفلات (Kanban)
export async function updateLeadStatus(leadId: string, newStatus: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus })
    .eq('id', leadId)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/leads')
  return { success: true }
}

// 3. إضافة عميل جديد
// استبدل دالة addLead القديمة بهذه الدالة المحدثة
export async function addLead(payload: any) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const client_name = payload?.get ? payload.get('clientName') : payload?.clientName || 'عميل جديد'
  const property_type = payload?.get ? payload.get('propertyType') : payload?.propertyType || 'غير محدد'
  const expected_value = payload?.get ? Number(payload.get('expectedValue')) : Number(payload?.expectedValue) || 0

  const { data: { user } } = await supabase.auth.getUser()

  // جلب ملف المستخدم لمعرفة شركته
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, account_type')
    .eq('id', user?.id)
    .single()

  const targetCompanyId = profile?.account_type === 'company' ? user?.id : profile?.company_id

  const { error } = await supabase
    .from('leads')
    .insert({ 
      client_name, 
      property_type, 
      expected_value, 
      status: 'Fresh Leads',
      user_id: user?.id,
      company_id: targetCompanyId // ختم الشركة لحماية ملكية العميل
    })

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/leads')
  return { success: true }
}
// 4. إضافة تقرير/تعليق للعميل (الحل الجذري: استقبال المتغيرات الأربعة بأمان تام)
export async function addLeadReport(
  leadId: string, 
  reportText: string, 
  reportStatus?: string, 
  followupDate?: string
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // دمج البيانات الإضافية بذكاء لتجنب أخطاء قاعدة البيانات إذا كانت الأعمدة غير موجودة
  let finalReportText = reportText || 'تحديث حالة'
  if (reportStatus) finalReportText += ` | الحالة: ${reportStatus}`
  if (followupDate) finalReportText += ` | المتابعة القادمة: ${followupDate}`

  const { error } = await supabase
    .from('lead_reports')
    .insert({
      lead_id: leadId,
      user_id: user?.id,
      report_text: finalReportText
    })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/leads')
  return { success: true }
}