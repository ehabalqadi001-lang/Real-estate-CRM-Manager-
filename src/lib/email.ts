'use server'

import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'CRM <noreply@fasteam.co>'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

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
    await getResend().emails.send({
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
    await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: `تم صرف عمولتك — ${params.dealTitle}`,
      html: commissionPaidHtml(params),
    })
  } catch {
    // silent
  }
}

function welcomeRoleSection(accountType: 'client' | 'individual' | 'company') {
  if (accountType === 'client') {
    return `
      <div style="background:#ecfdf5;border-right:4px solid #059669;border-radius:12px;padding:20px 24px;margin:20px 0">
        <p style="color:#065f46;font-size:15px;font-weight:900;margin:0 0 12px">استثمر بذكاء وأمان</p>
        <p style="color:#047857;font-size:13px;margin:0 0 12px;line-height:1.8">بصفتك عميلاً مميزاً لدينا، نضع بين يديك أدوات تمنحك رؤية استثمارية واضحة. من خلال حسابك ستتمكن من:</p>
        <ul style="margin:0;padding-right:20px;color:#065f46;font-size:13px;line-height:2.2">
          <li><strong>الوصول لفرص استثنائية:</strong> تصفح باقة منتقاة من أفضل العقارات والمشاريع المضمونة.</li>
          <li><strong>قرارات مبنية على الأرقام:</strong> استخدام أدواتنا التحليلية لمقارنة العوائد الاستثمارية (ROI) الحقيقية.</li>
          <li><strong>إدارة محفظتك:</strong> متابعة استثماراتك العقارية بسهولة وشفافية عبر لوحة تحكم مريحة.</li>
        </ul>
      </div>
    `
  }
  if (accountType === 'individual') {
    return `
      <div style="background:#eff6ff;border-right:4px solid #1d4ed8;border-radius:12px;padding:20px 24px;margin:20px 0">
        <p style="color:#1e3a8a;font-size:15px;font-weight:900;margin:0 0 12px">ضاعف مبيعاتك وأدر عملك باحترافية</p>
        <p style="color:#1d4ed8;font-size:13px;margin:0 0 12px;line-height:1.8">بصفتك شريك نجاح، صممنا لك بيئة عمل ذكية تناسب طموحك كقائد في المبيعات. عبر النظام ستستفيد من:</p>
        <ul style="margin:0;padding-right:20px;color:#1e3a8a;font-size:13px;line-height:2.2">
          <li><strong>نظام CRM متطور:</strong> لإدارة عملائك، متابعة خط سير المبيعات (Pipeline)، وتتبع عمولاتك بدقة.</li>
          <li><strong>شبكة علاقات قوية:</strong> تواصل مباشر مع كبرى الشركات وتوفير محفظة مشاريع ضخمة.</li>
          <li><strong>أدوات بيعية وتسويقية:</strong> بيانات وتحليلات جاهزة تساعدك على إقناع العميل ومضاعفة أرقامك.</li>
        </ul>
      </div>
    `
  }
  // company
  return `
    <div style="background:#faf5ff;border-right:4px solid #7c3aed;border-radius:12px;padding:20px 24px;margin:20px 0">
      <p style="color:#4c1d95;font-size:15px;font-weight:900;margin:0 0 12px">توسع مؤسسي وإدارة شاملة</p>
      <p style="color:#6d28d9;font-size:13px;margin:0 0 12px;line-height:1.8">بصفتك شركة تطوير أو تسويق عقاري، المنصة هنا لتكون ذراعك التقني والإداري. من خلال النظام يمكنك:</p>
      <ul style="margin:0;padding-right:20px;color:#4c1d95;font-size:13px;line-height:2.2">
        <li><strong>نظام ERP متكامل:</strong> إدارة فريق المبيعات، متابعة الأداء، وحساب العمولات آلياً.</li>
        <li><strong>عرض وتسويق مشاريعك:</strong> نافذة احترافية لعرض وحداتك أمام شبكة واسعة من الوسطاء والعملاء.</li>
        <li><strong>تحليلات استراتيجية:</strong> تقارير دقيقة لحركة السوق والمبيعات لدعم قرارات النمو.</li>
      </ul>
    </div>
  `
}

function welcomeCtaConfig(accountType: 'client' | 'individual' | 'company', dashboardUrl: string) {
  const config = {
    client:     { label: 'استكشف لوحة التحكم', color: '#059669' },
    individual: { label: 'ابدأ رحلتك الآن',       color: '#1d4ed8' },
    company:    { label: 'ابدأ رحلتك الآن',       color: '#7c3aed' },
  }[accountType]
  return `<a href="${dashboardUrl}" style="display:inline-block;background:${config.color};color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:900;letter-spacing:.3px">${config.label} ←</a>`
}

function welcomeEmailHtml(params: {
  name: string
  accountType: 'client' | 'individual' | 'company'
  dashboardUrl: string
}) {
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
          <div style="display:flex;align-items:center;gap:12px">
            <div>
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:.5px">FAST INVESTMENT</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,.65);font-size:12px;letter-spacing:.5px">بوابتك الذكية لمستقبل العقارات</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:32px 36px">
          <h2 style="margin:0 0 6px;color:#0f172a;font-size:24px;font-weight:900">أهلاً بك يا ${params.name} 🚀</h2>
          <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.9">
            يسعدنا جداً انضمامك إلى عائلة <strong style="color:#0f172a">FAST INVESTMENT</strong>. لقد صممنا هذا النظام التقني المتكامل ليكون أكثر من مجرد منصة؛ إنه شريكك الاستراتيجي الموثوق الذي يعتمد على أحدث أدوات التكنولوجيا والتحليل المالي لضمان تحقيق أهدافك العقارية بذكاء، سرعة، واحترافية.
          </p>

          ${welcomeRoleSection(params.accountType)}

          <p style="color:#475569;font-size:13px;margin:20px 0 24px;line-height:1.9">
            نحن متحمسون جداً لبدء هذه الرحلة معك. كل ما تحتاجه للبدء هو الضغط على الزر أدناه لاستكشاف لوحة التحكم الخاصة بك.
          </p>

          ${welcomeCtaConfig(params.accountType, params.dashboardUrl)}

          <p style="margin:28px 0 0;color:#94a3b8;font-size:12px;line-height:1.8">
            إذا كان لديك أي استفسار، فريق الدعم لدينا متواجد دائماً لخدمتك.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:18px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
          <p style="margin:0;color:#94a3b8;font-size:11px">مع خالص التحيات، <strong style="color:#64748b">فريق FAST INVESTMENT</strong></p>
          <p style="margin:4px 0 0;color:#cbd5e1;font-size:10px">هذا البريد أُرسل تلقائياً — يرجى عدم الرد عليه</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendWelcomeEmail(params: {
  to: string
  name: string
  accountType: 'client' | 'individual' | 'company'
  dashboardUrl?: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const base = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.replace(/\/$/, '') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const dashboardUrl = params.dashboardUrl ?? (
    params.accountType === 'client'     ? `${base}/marketplace/profile` :
    params.accountType === 'individual' ? `${base}/pending-approval` :
                                          `${base}/pending-approval`
  )
  try {
    await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: 'مرحباً بك في FAST INVESTMENT 🚀 - بوابتك الذكية لمستقبل العقارات',
      html: welcomeEmailHtml({ name: params.name, accountType: params.accountType, dashboardUrl }),
    })
  } catch {
    // email errors must never crash the registration flow
  }
}

function companyDecisionHtml(params: {
  title: string
  eyebrow: string
  ownerName: string
  companyName: string
  message: string
  actionLabel?: string
  actionUrl?: string
  reason?: string
  tone: 'approved' | 'rejected' | 'info'
}) {
  const toneStyles = {
    approved: {
      header: 'linear-gradient(135deg,#065f46 0%,#047857 100%)',
      panelBg: '#ecfdf5',
      panelBorder: '#a7f3d0',
      accent: '#047857',
    },
    rejected: {
      header: 'linear-gradient(135deg,#991b1b 0%,#dc2626 100%)',
      panelBg: '#fef2f2',
      panelBorder: '#fecaca',
      accent: '#b91c1c',
    },
    info: {
      header: 'linear-gradient(135deg,#1e40af 0%,#2563eb 100%)',
      panelBg: '#eff6ff',
      panelBorder: '#bfdbfe',
      accent: '#1d4ed8',
    },
  }[params.tone]

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width" /></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:${toneStyles.header};padding:28px 32px">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:900">FAST INVESTMENT CRM</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.72);font-size:13px">${params.eyebrow}</p>
        </div>
        <div style="padding:30px 32px">
          <p style="color:#475569;font-size:14px;margin:0 0 18px">مرحباً ${params.ownerName}،</p>
          <h2 style="color:#0f172a;font-size:20px;font-weight:900;margin:0 0 10px">${params.title}</h2>
          <p style="color:#475569;font-size:14px;line-height:1.8;margin:0 0 20px">${params.message}</p>
          <div style="background:${toneStyles.panelBg};border:1px solid ${toneStyles.panelBorder};border-radius:12px;padding:18px;margin:18px 0">
            <div style="font-size:12px;color:#64748b;margin-bottom:6px">الشركة</div>
            <div style="font-size:17px;font-weight:900;color:#0f172a">${params.companyName}</div>
            ${params.reason ? `<div style="margin-top:14px;font-size:12px;color:#64748b">التفاصيل</div><div style="margin-top:4px;font-size:14px;line-height:1.7;color:${toneStyles.accent};font-weight:700">${params.reason}</div>` : ''}
          </div>
          ${params.actionUrl && params.actionLabel ? `<a href="${params.actionUrl}" style="display:inline-block;background:${toneStyles.accent};color:#fff;text-decoration:none;padding:13px 24px;border-radius:10px;font-size:14px;font-weight:800">${params.actionLabel}</a>` : ''}
        </div>
        <div style="padding:16px 32px;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:11px;text-align:center">
          هذا البريد أُرسل تلقائياً من منصة FAST INVESTMENT CRM
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendCompanyApprovedEmail(params: {
  to: string
  ownerName: string
  companyName: string
  loginUrl?: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const loginUrl = params.loginUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`
  try {
    await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: `تمت الموافقة على شركة ${params.companyName}`,
      html: companyDecisionHtml({
        title: 'تم تفعيل حساب شركتك',
        eyebrow: 'موافقة حساب شركة وساطة',
        ownerName: params.ownerName,
        companyName: params.companyName,
        message: 'راجع فريق المنصة بيانات شركتك وتمت الموافقة عليها. يمكنك الآن تسجيل الدخول وإدارة الفريق والعملاء والصفقات من لوحة الشركة.',
        actionLabel: 'تسجيل الدخول الآن',
        actionUrl: loginUrl,
        tone: 'approved',
      }),
    })
  } catch {
    // email errors must never crash the admin flow
  }
}

export async function sendCompanyRejectedEmail(params: {
  to: string
  ownerName: string
  companyName: string
  reason: string
}) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: `تعذر قبول طلب شركة ${params.companyName}`,
      html: companyDecisionHtml({
        title: 'تعذر قبول طلب التسجيل',
        eyebrow: 'نتيجة مراجعة الشركة',
        ownerName: params.ownerName,
        companyName: params.companyName,
        message: 'بعد مراجعة الطلب، تعذر تفعيل حساب الشركة في الوقت الحالي. يمكنك مراجعة السبب أدناه والتواصل مع فريق الدعم لإعادة التقديم عند استكمال المطلوب.',
        reason: params.reason,
        tone: 'rejected',
      }),
    })
  } catch {
    // silent
  }
}

export async function sendCompanyInfoRequestedEmail(params: {
  to: string
  ownerName: string
  companyName: string
  reason: string
  dashboardUrl?: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const dashboardUrl = params.dashboardUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/company`
  try {
    await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: `مطلوب استكمال بيانات شركة ${params.companyName}`,
      html: companyDecisionHtml({
        title: 'مطلوب استكمال بيانات الشركة',
        eyebrow: 'طلب معلومات إضافية',
        ownerName: params.ownerName,
        companyName: params.companyName,
        message: 'يحتاج فريق المنصة إلى بيانات أو وثائق إضافية قبل تفعيل حساب شركتك. برجاء مراجعة المطلوب وتحديث البيانات من لوحة الشركة.',
        reason: params.reason,
        actionLabel: 'فتح لوحة الشركة',
        actionUrl: dashboardUrl,
        tone: 'info',
      }),
    })
  } catch {
    // silent
  }
}

// ─── Admin Action Notification ─────────────────────────────────

type AdminActionType =
  | 'approved'
  | 'rejected'
  | 'info_requested'
  | 'suspended'
  | 'reactivated'
  | 'status_changed'

type AdminActionUserType = 'client' | 'broker' | 'company' | 'team'

const ACTION_META: Record<AdminActionType, { tone: 'approved' | 'rejected' | 'info'; eyebrow: string; title: string; message: string }> = {
  approved:       { tone: 'approved', eyebrow: 'تفعيل الحساب',         title: 'تم تفعيل حسابك',              message: 'راجع الفريق طلبك وتمت الموافقة عليه. يمكنك الآن تسجيل الدخول والاستفادة الكاملة من جميع مزايا النظام.' },
  rejected:       { tone: 'rejected', eyebrow: 'نتيجة المراجعة',        title: 'تعذر قبول طلبك',              message: 'بعد مراجعة الطلب، تعذر تفعيل الحساب حالياً. راجع السبب أدناه وتواصل مع الدعم لإعادة التقديم.' },
  info_requested: { tone: 'info',     eyebrow: 'طلب معلومات إضافية',   title: 'مطلوب استكمال بياناتك',       message: 'يحتاج الفريق إلى بيانات أو وثائق إضافية قبل تفعيل الحساب. برجاء مراجعة المطلوب وتحديث بياناتك.' },
  suspended:      { tone: 'rejected', eyebrow: 'إجراء إداري',           title: 'تم تعليق حسابك مؤقتاً',      message: 'تم تعليق حسابك بشكل مؤقت من قِبل الإدارة. للاستفسار أو الاعتراض يرجى التواصل مع فريق الدعم.' },
  reactivated:    { tone: 'approved', eyebrow: 'إعادة تفعيل الحساب',   title: 'تم إعادة تفعيل حسابك',       message: 'تمت إعادة تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول والمتابعة من حيث توقفت.' },
  status_changed: { tone: 'info',     eyebrow: 'تحديث حالة الحساب',    title: 'تم تحديث حالة حسابك',        message: 'قامت الإدارة بتحديث حالة حسابك في المنظومة. راجع التفاصيل أدناه أو تواصل مع الدعم لمزيد من المعلومات.' },
}

const USER_TYPE_LABEL: Record<AdminActionUserType, string> = {
  client:  'عميل',
  broker:  'وسيط عقاري',
  company: 'شركة',
  team:    'عضو فريق',
}

function adminActionHtml(params: {
  recipientName: string
  userType: AdminActionUserType
  actionType: AdminActionType
  note?: string
  actionLabel?: string
  actionUrl?: string
}) {
  const meta = ACTION_META[params.actionType]
  return companyDecisionHtml({
    title: meta.title,
    eyebrow: `${meta.eyebrow} — ${USER_TYPE_LABEL[params.userType]}`,
    ownerName: params.recipientName,
    companyName: USER_TYPE_LABEL[params.userType],
    message: meta.message,
    reason: params.note,
    actionLabel: params.actionLabel,
    actionUrl: params.actionUrl,
    tone: meta.tone,
  })
}

export async function sendAdminActionEmail(params: {
  to: string
  recipientName: string
  userType: AdminActionUserType
  actionType: AdminActionType
  note?: string
  actionLabel?: string
  actionUrl?: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const subjectMap: Record<AdminActionType, string> = {
    approved:       `تم تفعيل حسابك في FAST INVESTMENT`,
    rejected:       `تعذر قبول طلبك في FAST INVESTMENT`,
    info_requested: `مطلوب استكمال بياناتك — FAST INVESTMENT`,
    suspended:      `تم تعليق حسابك مؤقتاً — FAST INVESTMENT`,
    reactivated:    `تم إعادة تفعيل حسابك — FAST INVESTMENT`,
    status_changed: `تحديث حالة حسابك — FAST INVESTMENT`,
  }
  try {
    await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: subjectMap[params.actionType],
      html: adminActionHtml(params),
    })
  } catch {
    // admin notifications must never crash admin actions
  }
}
