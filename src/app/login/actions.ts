'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, message: 'فشل تسجيل الدخول', details: error.message }
  }

  // التوجيه للوحة التحكم بعد النجاح
  redirect('/dashboard')
}

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const accountType = formData.get('accountType') as string // 'individual' or 'company'
  const companyName = formData.get('companyName') as string

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // تسجيل حساب جديد وحفظ البيانات الإضافية في الـ Metadata
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: accountType,
        company_name: accountType === 'company' ? companyName : null,
        role: accountType === 'company' ? 'company_admin' : 'agent', // منح دور مبدئي
      }
    }
  })

  if (error) {
    return { success: false, message: 'فشل إنشاء الحساب', details: error.message }
  }

  redirect('/dashboard')
}