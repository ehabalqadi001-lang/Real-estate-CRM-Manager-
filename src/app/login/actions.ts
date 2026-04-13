'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * 1. دالة تسجيل الدخول (Login)
 * تتأكد من هوية المستخدم وتوجهه للداشبورد مباشرة إذا كان حسابه مفعلاً.
 */
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
    return { 
      success: false, 
      message: 'فشل تسجيل الدخول. يرجى التأكد من صحة البريد وكلمة المرور.', 
      details: error.message 
    }
  }

  redirect('/dashboard')
}

/**
 * 2. دالة إنشاء حساب جديد (Register) - النسخة الهندسية المحدثة
 * تقوم بمعالجة رفع الوثائق، إنشاء الحساب، وتفعيل صمام الأمان (Pending Approval).
 */
export async function registerAction(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // استخراج البيانات الأساسية والإضافية حسب نوع الحساب 
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const accountType = formData.get('accountType') as string // 'individual' أو 'company'
  const companyName = formData.get('companyName') as string
  const phone = formData.get('phone') as string
  const region = formData.get('region') as string
  const commercialRegNo = formData.get('commercialRegNo') as string

  // --- محرك رفع الوثائق لـ Supabase Storage  ---
  async function uploadSecureDocument(fieldName: string, folder: string) {
    const file = formData.get(fieldName) as File | null
    if (!file || file.size === 0) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (error) {
      console.error(`Error uploading ${fieldName}:`, error.message)
      return null
    }
    return data.path
  }

  try {
    // تنفيذ عمليات رفع الملفات (البطاقة والسجل التجاري)
    const idDocumentUrl = await uploadSecureDocument('idDocument', 'ids')
    const licenseDocumentUrl = accountType === 'company' 
      ? await uploadSecureDocument('licenseDocument', 'licenses') 
      : null

    // إنشاء الحساب في نظام المصادقة مع تخزين البيانات في Metadata 
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType,
          company_name: accountType === 'company' ? companyName : null,
          phone: phone,
          region: region,
          commercial_reg_no: commercialRegNo || null,
          id_document_url: idDocumentUrl,
          license_document_url: licenseDocumentUrl,
          // صمام الأمان: منع الدخول المباشر 
          status: 'pending', 
          role: accountType === 'company' ? 'company_admin' : 'agent',
        }
      }
    })

    if (error) {
      return { 
        success: false, 
        message: 'فشل إنشاء الحساب في قاعدة البيانات', 
        details: error.message 
      }
    }
    
  } catch (err: any) {
    // استثناء خاص لعملية الـ Redirect في Next.js
    if (err.digest?.startsWith('NEXT_REDIRECT')) throw err;
    
    return { 
      success: false, 
      message: 'خطأ غير متوقع في محرك التسجيل', 
      details: err.message 
    }
  }

  // التوجيه النهائي لصفحة الانتظار (منطقة الأمان)
  redirect('/pending-approval')
}