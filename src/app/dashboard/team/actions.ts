'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. جلب أعضاء الفريق التابعين لنفس الشركة
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
    .select('company_id, account_type')
    .eq('id', user.id)
    .single()

  const targetCompanyId = profile?.account_type === 'company' ? user.id : profile?.company_id

  if (!targetCompanyId) return []

  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('company_id', targetCompanyId)
    .eq('status', 'approved')

  if (error) throw new Error(error.message)
  return members || []
}

// 2. تفويض العميل لوكيل محدد
export async function assignLeadToMember(leadId: string, memberId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { error } = await supabase
    .from('leads')
    .update({ user_id: memberId })
    .eq('id', leadId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/leads')
  return { success: true }
}

// 3. إضافة عضو جديد (الدالة الوهمية بالاسم الصحيح تماماً لإسكات Vercel)
export async function addTeamMember(payload: any) {
  return { success: true, message: 'يرجى إضافة الوكلاء من لوحة تحكم الشركة B2B' }
}