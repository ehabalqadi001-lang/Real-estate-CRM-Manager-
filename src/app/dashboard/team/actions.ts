'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

interface TeamMemberPayload {
  email?: string
  password?: string
  fullName?: string
  phone?: string
}

function isFormData(p: TeamMemberPayload | FormData): p is FormData {
  return typeof (p as FormData).get === 'function'
}

// 1. الدالة المستردة: إضافة وكيل جديد للفريق
export async function addTeamMember(payload: TeamMemberPayload | FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const fd = isFormData(payload)
  const email = fd ? payload.get('email') as string : payload.email
  const password = (fd ? payload.get('password') as string : payload.password) || '123456'
  const fullName = fd ? payload.get('fullName') as string : payload.fullName
  const phone = fd ? payload.get('phone') as string : payload.phone

  if (!email) return { success: false, error: 'البريد الإلكتروني مطلوب' }

  // تحديد ختم الشركة التابع لها المدير
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  const targetCompanyId = profile?.company_id || user.id

  // إنشاء حساب الوكيل وربطه بالشركة
  const { error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
        role: 'agent',
        company_id: targetCompanyId
      }
    }
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/team')
  revalidatePath('/company/dashboard')
  return { success: true }
}

// 2. دالة جلب أعضاء الفريق
export async function getTeamMembers() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
    
  const targetCompanyId = profile?.company_id ? profile.company_id : user.id

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('company_id', targetCompanyId)
    .eq('role', 'agent')

  if (error) throw new Error(error.message)
  return data || []
}

// 3. المحرك الآلي: التفويض + إطلاق الإشعارات
export async function assignLeadToMember(leadId: string, memberId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: lead } = await supabase
    .from('leads')
    .select('client_name')
    .eq('id', leadId)
    .single()

  const { error: updateError } = await supabase
    .from('leads')
    .update({ user_id: memberId })
    .eq('id', leadId)

  if (updateError) throw new Error(updateError.message)

  if (lead) {
    await supabase
      .from('notifications')
      .insert({
        user_id: memberId,
        title: '🎯 تكليف إداري: عميل جديد',
        message: `القيادة قامت بتفويض العميل (${lead.client_name}) إلى عهدتك. يرجى مراجعة الصندوق الأسود والمتابعة فوراً.`,
        link: `/dashboard/leads/${leadId}`
      })
  }

  revalidatePath('/dashboard/leads')
  return { success: true }
}