'use server'

import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

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
    const fallback = await sendRecoveryWithResend(email, redirectTo)
    if (fallback.ok) return fallback

    return fallback
  }

  return {
    ok: true,
    message: 'إذا كان البريد مسجلاً لدينا، ستصلك رسالة تحتوي على رابط تعيين كلمة مرور جديدة.',
  }
}

async function sendRecoveryWithResend(email: string, redirectTo: string): Promise<ForgotPasswordState> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey = process.env.RESEND_API_KEY

  if (!serviceRoleKey || !resendKey) {
    return {
      ok: false,
      message: 'تعذر إرسال رابط استعادة كلمة المرور',
      details: 'Supabase SMTP failed and Resend fallback is not configured.',
    }
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (error || !data.properties?.action_link) {
    return {
      ok: false,
      message: 'تعذر إنشاء رابط استعادة كلمة المرور',
      details: error?.message ?? 'Missing recovery link',
    }
  }

  const resend = new Resend(resendKey)
  const from = process.env.EMAIL_FROM ?? 'Fast Investment CRM <onboarding@resend.dev>'

  try {
    await resend.emails.send({
      from,
      to: email,
      subject: 'استعادة كلمة المرور - Fast Investment CRM',
      html: recoveryEmailHtml(data.properties.action_link),
    })
  } catch (mailError) {
    return {
      ok: false,
      message: 'تعذر إرسال رابط استعادة كلمة المرور',
      details: mailError instanceof Error ? mailError.message : 'Resend failed',
    }
  }

  return {
    ok: true,
    message: 'إذا كان البريد مسجلاً لدينا، ستصلك رسالة تحتوي على رابط تعيين كلمة مرور جديدة.',
  }
}

function recoveryEmailHtml(link: string) {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body style="margin:0;padding:0;background:#f7faf8;font-family:Arial,'Tahoma',sans-serif;direction:rtl">
        <div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e4ece7;border-radius:16px;overflow:hidden">
          <div style="background:#17375e;padding:28px 32px">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:900">Fast Investment CRM</h1>
            <p style="margin:6px 0 0;color:#dbeafe;font-size:13px">استعادة كلمة المرور</p>
          </div>
          <div style="padding:30px 32px;color:#17202a">
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:900">تعيين كلمة مرور جديدة</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.9">
              وصلنا طلب لاستعادة كلمة المرور لحسابك. اضغط على الزر التالي واختر كلمة مرور جديدة. إذا لم تطلب هذا الإجراء، تجاهل هذه الرسالة.
            </p>
            <a href="${link}" style="display:inline-block;background:#27ae60;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:900">
              استعادة كلمة المرور
            </a>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.7;direction:ltr;text-align:left;word-break:break-all">
              ${link}
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}
