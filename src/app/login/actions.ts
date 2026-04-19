'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
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
              cookieStore.set({ name, value, ...options })
            })
          } catch {}
        },
      },
    }
  )
}

const ROLE_ALIASES: Record<string, string> = {
  'Super Admin': 'super_admin',
  Super_Admin: 'super_admin',
  SuperAdmin: 'super_admin',
  super_admin: 'super_admin',
  platform_admin: 'platform_admin',
  'Platform Admin': 'platform_admin',
  company_owner: 'company_owner',
  company_admin: 'company_admin',
  'Company Admin': 'company_admin',
  company: 'company_owner',
  admin: 'company_admin',
  Admin: 'company_admin',
  CLIENT: 'viewer',
  client: 'viewer',
  viewer: 'viewer',
}

const FAST_INVESTMENT_WELCOME_WHATSAPP = 'مرحباً بك في FAST INVESTMENT. تم تفعيل حسابك بنجاح.'

async function getRequestOrigin() {
  const headerStore = await headers()
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  if (!host) return null

  const protocol = headerStore.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

async function sendRegistrationWelcomeWhatsApp(phone: string) {
  const token = process.env.RESPOND_IO_API_TOKEN
  const origin = await getRequestOrigin()

  if (!token || !origin) return

  const response = await fetch(`${origin}/api/whatsapp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-fast-investment-internal-token': token,
    },
    body: JSON.stringify({
      phone,
      message: FAST_INVESTMENT_WELCOME_WHATSAPP,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `WhatsApp welcome route failed with status ${response.status}`)
  }
}

function normalizeRole(role: unknown) {
  const value = String(role ?? '').trim()
  if (!value) return 'agent'
  return ROLE_ALIASES[value] ?? value
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = await getSupabaseClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return {
      success: false,
      message: 'فشل تسجيل الدخول. يرجى التأكد من صحة البيانات.',
      details: error.message,
    }
  }

  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle()

    const cookieStore = await cookies()
    cookieStore.set('user_role', normalizeRole(profile?.role), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  redirect('/')
}

export async function registerAction(formData: FormData) {
  const supabase = await getSupabaseClient()

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('fullName') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const region = String(formData.get('region') ?? '').trim()
  const companyName = String(formData.get('companyName') ?? '').trim()
  const commercialRegNo = String(formData.get('commercialRegNo') ?? '').trim()
  const registrationMode = String(formData.get('registrationMode') ?? 'partner')
  const isClientRegistration = registrationMode === 'client'
  const requestedAccountType = String(formData.get('accountType') ?? 'individual')
  const accountType = isClientRegistration ? 'client' : requestedAccountType
  const role = isClientRegistration ? 'CLIENT' : accountType === 'company' ? 'company_admin' : 'agent'

  async function uploadSecureDocument(fieldName: string, folder: string) {
    const file = formData.get(fieldName)
    if (!(file instanceof File) || file.size === 0) return null
    const fileExt = file.name.split('.').pop() ?? 'bin'
    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
    const { data, error } = await supabase.storage.from('documents').upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })
    if (error) return null
    return data.path
  }

  try {
    const idDocUrl = isClientRegistration ? null : await uploadSecureDocument('idDocument', 'ids')
    const licDocUrl = !isClientRegistration && accountType === 'company'
      ? await uploadSecureDocument('licenseDocument', 'licenses')
      : null

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType,
          company_name: companyName || null,
          phone,
          region,
          commercial_reg_no: commercialRegNo || null,
          id_document_url: idDocUrl,
          license_document_url: licDocUrl,
          status: isClientRegistration ? 'active' : 'pending',
        },
      },
    })

    if (error) {
      return { success: false, message: 'فشل إنشاء الحساب', details: error.message }
    }

    if (data.user?.id) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone,
        region,
        account_type: accountType,
        role,
        status: isClientRegistration ? 'active' : 'pending',
        company_name: accountType === 'company' ? companyName || null : null,
        preferred_contact: isClientRegistration ? 'whatsapp' : null,
        is_active: isClientRegistration,
      })

      if (profileError) {
        return { success: false, message: 'تم إنشاء الحساب ولم يكتمل حفظ الملف الشخصي', details: profileError.message }
      }

      if (phone) {
        try {
          await sendRegistrationWelcomeWhatsApp(phone)
        } catch (error: unknown) {
          console.error('Failed to send registration WhatsApp welcome message', error)
        }
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && (err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء التسجيل',
      details: err instanceof Error ? err.message : 'خطأ غير معروف',
    }
  }

  if (isClientRegistration) redirect('/marketplace/profile')
  redirect('/pending-approval')
}
