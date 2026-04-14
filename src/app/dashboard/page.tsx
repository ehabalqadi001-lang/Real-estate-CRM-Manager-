import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function DashboardRoot() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. التحقق من الهوية الأمنية
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 2. جلب رتبة المستخدم (المدير أو الوكيل)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // 3. التوجيه التكتيكي الصارم
  if (profile?.role === 'company_admin' || profile?.role === 'admin') {
    // القيادة الإدارية تتجه لغرفة التحكم العليا
    redirect('/company/dashboard')
  } else {
    // الوكلاء يتجهون لغرفة العمليات الفردية
    redirect('/dashboard/agent')
  }
}