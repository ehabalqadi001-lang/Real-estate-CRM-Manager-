'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// 1. دالة مركزية لإنشاء اتصال آمن مع تثبيت الكوكيز (لمنع دوامة تسجيل الدخول)
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
            cookiesToSet.forEach(({ name, value, options }) => {
              // الصيغة المعتمدة لـ Next.js 15
              cookieStore.set({ name, value, ...options })
            })
          } catch {
            // يتم تجاهل الخطأ هنا لأن الـ Proxy سيتولى عملية تحديث الجلسة لاحقاً
          }
        },
      },
    }
  )
}

// 2. دالة تسجيل الدخول (Login)
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await getSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // صائد الأخطاء لعملية الدخول
  if (error) {
    return { success: false, message: 'فشل تسجيل الدخول. يرجى التأكد من صحة البيانات.', details: error.message }
  }

  // التوجيه الذكي: نوجه المستخدم إلى "الجذر" (/) ونترك الـ Proxy يقرر مساره حسب رتبته
  redirect('/') 
}

// 3. دالة إنشاء حساب جديد (Register)
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

  // دالة مساعدة لرفع الوثائق بأمان
  async function uploadSecureDocument(fieldName: string, folder: string) {
    const file = formData.get(fieldName) as File | null
    if (!file || file.size === 0) return null
    const fileExt = file.name.split('.').pop()
    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const { data, error } = await supabase.storage.from('documents').upload(filePath, file)
    if (error) return null
    return data.path
  }

  try {
    const idDocUrl = await uploadSecureDocument('idDocument', 'ids')
    const licDocUrl = accountType === 'company' ? await uploadSecureDocument('licenseDocument', 'licenses') : null

    const { error } = await supabase.auth.signUp({
      email, 
      password,
      options: {
        data: {
          full_name: fullName, 
          account_type: accountType, 
          company_name: companyName || null,
          phone: phone, 
          region: region, 
          commercial_reg_no: commercialRegNo || null,
          id_document_url: idDocUrl, 
          license_document_url: licDocUrl,
          status: 'pending', 
          role: accountType === 'company' ? 'company_admin' : 'agent',
        }
      }
    })

    if (error) return { success: false, message: 'فشل إنشاء الحساب', details: error.message }
  } catch (err: unknown) {
    // السماح لعمليات التوجيه الشرعية بالمرور دون اعتبارها أخطاء
    if (err instanceof Error && (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    return { success: false, message: 'حدث خطأ غير متوقع أثناء التسجيل', details: err instanceof Error ? err.message : 'خطأ غير معروف' }
  }

  // التوجيه إلى منطقة الانتظار لحين موافقة الإدارة العليا
  redirect('/pending-approval')
}