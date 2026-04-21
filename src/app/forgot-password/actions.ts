'use server'

import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type ForgotPasswordState = {
  ok: boolean
  message: string
  details?: string
}

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    },
  )
}

async function getOrigin() {
  const headerStore = await headers()
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const protocol = headerStore.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

export async function requestPasswordReset(formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email) {
    return { ok: false, message: 'البريد الإلكتروني مطلوب' }
  }

  const supabase = await getSupabaseClient()
  const origin = await getOrigin()
  const redirectTo = `${origin}/auth/callback?next=/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    return {
      ok: false,
      message: 'تعذر إرسال رابط استعادة كلمة المرور',
      details: error.message,
    }
  }

  return {
    ok: true,
    message: 'إذا كان البريد مسجلاً لدينا، ستصلك رسالة تحتوي على رابط تعيين كلمة مرور جديدة.',
  }
}
