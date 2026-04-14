'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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
              // الصيغة الصحيحة لـ Next.js 15
              cookieStore.set({ name, value, ...options })
            })
          } catch (error) {
            // تجاهل أخطاء الـ Server Action لأن الـ Proxy سيعالجها
          }
        },
      },
    }
  )
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await getSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, message: 'فشل تسجيل الدخول. تأكد من البيانات.', details: error.message }
  }

  redirect('/dashboard')
}

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
      email, password,
      options: {
        data: {
          full_name: fullName, account_type: accountType, company_name: companyName || null,
          phone: phone, region: region, commercial_reg_no: commercialRegNo || null,
          id_document_url: idDocUrl, license_document_url: licDocUrl,
          status: 'pending', role: accountType === 'company' ? 'company_admin' : 'agent',
        }
      }
    })

    if (error) return { success: false, message: 'فشل التسجيل', details: error.message }
  } catch (err: any) {
    if (err.digest?.startsWith('NEXT_REDIRECT')) throw err;
    return { success: false, message: 'خطأ غير متوقع', details: err.message }
  }

  redirect('/pending-approval')
}