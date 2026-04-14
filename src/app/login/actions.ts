'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// --- دالة مساعدة لإنشاء اتصال Supabase مع دعم كامل لحفظ الكوكيز ---
async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // يتم تجاهل الخطأ هنا لأن الـ Middleware (proxy) سيتولى تحديث الجلسة
          }
        },
      },
    }
  )
}

/**
 * 1. دالة تسجيل الدخول (Login)
 */
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await getSupabaseClient()

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

  // التوجيه للداشبورد بعد زرع الكوكيز بنجاح
  redirect('/dashboard')
}

/**
 * 2. دالة إنشاء حساب جديد (Register)
 */
export async function registerAction(formData: FormData) {
  const supabase = await getSupabaseClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const accountType = formData.get('accountType') as string 
  const companyName = formData.get('companyName') as string
  const phone = formData.get('phone') as string
  const region = formData.get('region') as string
  const commercialRegNo = formData.get('commercialRegNo') as string

  // رفع الوثائق
  async function uploadSecureDocument(fieldName: string, folder: string) {
    const file = formData.get(fieldName) as File | null
    if (!file || file.size === 0) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage.from('documents').upload(filePath, file)
    if (error) return null
    return data.path
  }

  try {
    const idDocumentUrl = await uploadSecureDocument('idDocument', 'ids')
    const licenseDocumentUrl = accountType === 'company' 
      ? await uploadSecureDocument('licenseDocument', 'licenses') 
      : null

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
          status: 'pending', 
          role: accountType === 'company' ? 'company_admin' : 'agent',
        }
      }
    })

    if (error) {
      return { success: false, message: 'فشل إنشاء الحساب في قاعدة البيانات', details: error.message }
    }
  } catch (err: any) {
    if (err.digest?.startsWith('NEXT_REDIRECT')) throw err;
    return { success: false, message: 'خطأ غير متوقع في محرك التسجيل', details: err.message }
  }

  redirect('/pending-approval')
}