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

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, message: 'فشل تسجيل الدخول', details: error.message }
  }

  redirect('/dashboard')
}

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const accountType = formData.get('accountType') as string
  const companyName = formData.get('companyName') as string
  const phone = formData.get('phone') as string
  const region = formData.get('region') as string
  const commercialRegNo = formData.get('commercialRegNo') as string

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // --- دالة مساعدة لرفع الملفات ---
  async function uploadFile(fieldName: string, folder: string) {
    const file = formData.get(fieldName) as File | null
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data, error } = await supabase.storage.from('documents').upload(filePath, file)
      if (data) return data.path
      console.error('Upload error:', error)
    }
    return null
  }

  // رفع الملفات
  const idDocumentUrl = await uploadFile('idDocument', 'ids')
  const licenseDocumentUrl = accountType === 'company' ? await uploadFile('licenseDocument', 'licenses') : null

  // إنشاء الحساب وحفظ كافة البيانات في الـ Metadata
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: accountType,
        company_name: accountType === 'company' ? companyName : null,
        role: accountType === 'company' ? 'company_admin' : 'agent',
        status: 'pending',
        phone,
        region,
        commercial_reg_no: commercialRegNo || null,
        id_document_url: idDocumentUrl,
        license_document_url: licenseDocumentUrl
      }
    }
  })

  if (error) {
    return { success: false, message: 'فشل إنشاء الحساب', details: error.message }
  }

  redirect('/dashboard')
}