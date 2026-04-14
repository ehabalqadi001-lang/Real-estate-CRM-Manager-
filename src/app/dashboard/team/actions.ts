'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. دالة جلب أعضاء الفريق (موجودة مسبقاً للحفاظ على استقرار اللوحة)
export async function getTeamMembers() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // تحديد هوية الشركة لجلب وكلائها فقط
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

// 2. المحرك المطور: دالة التفويض + إطلاق جرس التنبيه (The Trigger)
export async function assignLeadToMember(leadId: string, memberId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // الخطوة (أ): جلب اسم العميل ليكون الإشعار احترافياً وشخصياً
  const { data: lead } = await supabase
    .from('leads')
    .select('client_name')
    .eq('id', leadId)
    .single()

  // الخطوة (ب): نقل ملكية العميل للوكيل الجديد
  const { error: updateError } = await supabase
    .from('leads')
    .update({ user_id: memberId })
    .eq('id', leadId)

  if (updateError) throw new Error(updateError.message)

  // الخطوة (ج): إطلاق الإشعار الآلي في جهاز اللاسلكي الخاص بالوكيل (Notification)
  if (lead) {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: memberId,
        title: '🎯 تكليف إداري: عميل جديد',
        message: `القيادة قامت بتفويض العميل (${lead.client_name}) إلى عهدتك. يرجى مراجعة الصندوق الأسود والمتابعة فوراً.`,
        link: `/dashboard/leads/${leadId}`
      })
      
    if (notificationError) {
      console.error("Failed to send notification:", notificationError)
      // لن نوقف العملية الأساسية إذا فشل الإشعار لسبب طارئ
    }
  }

  // الخطوة (د): تحديث الكاش لتنعكس التعديلات في اللوحة
  revalidatePath('/dashboard/leads')
  return { success: true }
}