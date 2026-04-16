'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'CRM <noreply@fasteam.co>'

// ─── Templates ────────────────────────────────────────────────

function dealStageChangedHtml(params: {
  agentName: string
  clientName: string
  dealTitle: string
  oldStage: string
  newStage: string
  dealUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width" /></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 32px">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:900">FAST INVESTMENT CRM</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.6);font-size:13px">تحديث مرحلة الصفقة</p>
        </div>
        <div style="padding:28px 32px">
          <p style="color:#475569;font-size:14px;margin:0 0 20px">مرحباً ${params.agentName}،</p>
          <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 8px">تم تحديث مرحلة الصفقة</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:16px 0">
            <div style="font-size:13px;color:#64748b;margin-bottom:6px">الصفقة</div>
            <div style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:16px">${params.dealTitle}</div>
            <div style="display:flex;gap:12px;align-items:center">
              <span style="background:#fef3c7;color:#92400e;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700">${params.oldStage}</span>
              <span style="color:#94a3b8;font-size:18px">←</span>
              <span style="background:#d1fae5;color:#065f46;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:800">${params.newStage}</span>
            </div>
          </div>
          <p style="color:#64748b;font-size:13px;margin:0 0 20px">العميل: <strong style="color:#0f172a">${params.clientName}</strong></p>
          <a href="${params.dealUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:800">
            عرض الصفقة ←
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:11px;text-align:center">
          هذا البريد أُرسل تلقائياً من منظومة FAST INVESTMENT CRM
        </div>
      </div>
    </body>
    </html>
  `
}

function commissionPaidHtml(params: {
  recipientName: string
  amount: number
  dealTitle: string
  commissionType: string
}) {
  const formatted = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(params.amount)
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="UTF-8" /></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:linear-gradient(135deg,#065f46 0%,#047857 100%);padding:28px 32px">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:900">FAST INVESTMENT CRM</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.7);font-size:13px">إشعار صرف عمولة</p>
        </div>
        <div style="padding:28px 32px">
          <p style="color:#475569;font-size:14px;margin:0 0 20px">مرحباً ${params.recipientName}،</p>
          <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px">تم اعتماد صرف عمولتك 🎉</p>
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:24px;text-align:center;margin:16px 0">
            <div style="font-size:13px;color:#065f46;margin-bottom:8px">قيمة العمولة المصروفة</div>
            <div style="font-size:36px;font-weight:900;color:#047857">${formatted}</div>
            <div style="font-size:12px;color:#6ee7b7;margin-top:6px">${params.commissionType} — ${params.dealTitle}</div>
          </div>
          <p style="color:#64748b;font-size:13px;margin:16px 0 0">يرجى مراجعة حسابك البنكي خلال 24-48 ساعة عمل.</p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:11px;text-align:center">
          FAST INVESTMENT CRM — الرقابة المالية
        </div>
      </div>
    </body>
    </html>
  `
}

// ─── Public functions ─────────────────────────────────────────

export async function sendDealStageChangedEmail(params: {
  to: string
  agentName: string
  clientName: string
  dealTitle: string
  oldStage: string
  newStage: string
  dealId: string
}) {
  if (!process.env.RESEND_API_KEY) return // silently skip if not configured
  const dealUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/deals/${params.dealId}`
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `صفقة محدّثة: ${params.dealTitle} → ${params.newStage}`,
      html: dealStageChangedHtml({ ...params, dealUrl }),
    })
  } catch {
    // email errors must never crash the main flow
  }
}

export async function sendCommissionPaidEmail(params: {
  to: string
  recipientName: string
  amount: number
  dealTitle: string
  commissionType: string
}) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `تم صرف عمولتك — ${params.dealTitle}`,
      html: commissionPaidHtml(params),
    })
  } catch {
    // silent
  }
}

export async function sendWelcomeEmail(params: {
  to: string
  agentName: string
  loginUrl?: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const loginUrl = params.loginUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: 'مرحباً بك في FAST INVESTMENT CRM',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8" /></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl">
          <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
            <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:28px 32px">
              <h1 style="margin:0;color:#fff;font-size:20px;font-weight:900">FAST INVESTMENT CRM</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,.7);font-size:13px">منصة إدارة المبيعات العقارية</p>
            </div>
            <div style="padding:28px 32px">
              <p style="color:#0f172a;font-size:18px;font-weight:800;margin:0 0 12px">أهلاً بك يا ${params.agentName} 👋</p>
              <p style="color:#475569;font-size:14px;margin:0 0 24px">تم تفعيل حسابك بنجاح في منظومة FAST INVESTMENT CRM. يمكنك الآن تسجيل الدخول وبدء إدارة عملاءك وصفقاتك.</p>
              <a href="${loginUrl}" style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:800">
                تسجيل الدخول الآن ←
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch {
    // silent
  }
}
