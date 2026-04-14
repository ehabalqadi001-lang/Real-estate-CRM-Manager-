'use server'

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function addAgentAction(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  // 1. جلب بيانات المدير الحالي (الشركة) لمعرفة هويتها
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  
  const { data: { user: manager } } = await supabase.auth.getUser()
  if (!manager) throw new Error("غير مصرح لك بإضافة وكلاء")

  // 2. استخدام مفتاح الإدارة لإنشاء الحساب في الخلفية بدون التأثير على جلسة المدير
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // المفتاح السري الذي أضفناه
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: newAgent, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // تفعيل فوري بدون إيميلات
    user_metadata: {
      full_name: fullName,
      phone: phone,
      role: 'agent',
      account_type: 'individual',
      status: 'approved', // الوكيل يكون معتمداً فوراً لأن مديره هو من أضافه
    }
  })

  if (createError) {
    return { success: false, message: 'تعذر إنشاء الحساب', details: createError.message }
  }

  // 3. ربط الوكيل الجديد بالشركة التي أنشأته
  if (newAgent.user) {
    await supabaseAdmin
      .from('profiles')
      .update({ company_id: manager.id })
      .eq('id', newAgent.user.id)
  }

  // التوجيه للوحة الشركة بعد النجاح
  redirect('/company/dashboard')
}