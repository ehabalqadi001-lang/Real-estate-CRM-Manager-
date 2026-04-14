'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. رادار التقاط الإشعارات للوكيل أو المدير الحالي
export async function getMyNotifications() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10) // جلب أحدث 10 إشعارات فقط لسرعة الأداء

  if (error) throw new Error(error.message)
  return data || []
}

// 2. تحديث حالة الإشعار إلى "تمت القراءة"
export async function markNotificationAsRead(id: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  revalidatePath('/', 'layout')
  return { success: true }
}
