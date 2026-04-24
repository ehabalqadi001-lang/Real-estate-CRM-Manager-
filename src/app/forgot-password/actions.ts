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
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl">
      <div style="max-width:600px;margin:36px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.10)">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#17375e 100%);padding:32px 36px">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:.5px">FAST INVESTMENT</h1>
          <p style="margin:5px 0 0;color:rgba(255,255,255,.60);font-size:12px;letter-spacing:.5px">بوابتك الذكية لمستقبل العقارات</p>
        </div>

        <!-- Icon row -->
        <div style="padding:32px 36px 0">
          <div style="width:56px;height:56px;background:#fef3c7;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:20px">
            <span style="font-size:28px;line-height:1">🔐</span>
          </div>

          <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:900">استعادة كلمة المرور</h2>
          <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.9">
            تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منظومة <strong style="color:#0f172a">FAST INVESTMENT</strong>.
            اضغط على الزر أدناه لتحديد كلمة مرور جديدة آمنة.
          </p>

          <!-- Security notice box -->
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:28px">
            <p style="margin:0;color:#92400e;font-size:13px;line-height:1.8">
              ⚠️ <strong>لم تطلب هذا الإجراء؟</strong> تجاهل هذه الرسالة تماماً — لن يحدث أي تغيير لحسابك.
              ينتهي هذا الرابط خلال <strong>ساعة واحدة</strong>.
            </p>
          </div>

          <!-- CTA Button -->
          <a href="${link}"
             style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#fff;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:16px;font-weight:900;letter-spacing:.3px;box-shadow:0 4px 12px rgba(5,150,105,.35)">
            إعادة تعيين كلمة المرور ←
          </a>

          <p style="margin:28px 0 0;color:#94a3b8;font-size:12px;line-height:1.7">
            إذا لم يعمل الزر، انسخ الرابط التالي والصقه في متصفحك:
          </p>
          <p style="margin:6px 0 0;color:#64748b;font-size:11px;line-height:1.7;direction:ltr;text-align:left;word-break:break-all;background:#f8fafc;padding:10px 14px;border-radius:8px;border:1px solid #e2e8f0">
            ${link}
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:24px 36px;margin-top:32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
          <p style="margin:0;color:#94a3b8;font-size:11px">
            مع خالص التحيات، <strong style="color:#64748b">فريق FAST INVESTMENT</strong>
          </p>
          <p style="margin:4px 0 0;color:#cbd5e1;font-size:10px">
            هذا البريد أُرسل تلقائياً — يرجى عدم الرد عليه
          </p>
        </div>

      </div>
    </body>
    </html>
  `
}
