import 'server-only'

import { Resend } from 'resend'
import type { WeeklyInsightsResult } from './types'

const FROM = process.env.EMAIL_FROM ?? 'Fast Investment CRM <onboarding@resend.dev>'

export async function sendWeeklyInsightsEmail(params: {
  to: string
  agentName: string
  weekLabel: string
  insights: WeeklyInsightsResult
}) {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `تقريرك الأسبوعي من Fast Investment CRM - ${params.weekLabel}`,
    html: weeklyHtml(params),
  })
}

function weeklyHtml(params: {
  agentName: string
  weekLabel: string
  insights: WeeklyInsightsResult
}) {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width" /></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl">
      <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <div style="background:#050816;padding:28px 32px">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:900">FAST INVESTMENT CRM</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.72);font-size:13px">تقرير الذكاء الاصطناعي الأسبوعي</p>
        </div>
        <div style="padding:30px 32px">
          <p style="margin:0 0 18px;color:#475569;font-size:14px">مرحباً ${params.agentName}، هذا ملخص أسبوع ${params.weekLabel}.</p>
          ${section('أبرز إنجازات الأسبوع', params.insights.achievements)}
          ${section('صفقات تحتاج اهتماماً', params.insights.attention_deals)}
          ${section('توقعات الأسبوع القادم', params.insights.next_week_forecast)}
          <div style="margin-top:20px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:12px;padding:16px">
            <div style="font-size:12px;color:#1d4ed8;font-weight:800;margin-bottom:6px">نصيحة تطوير مهني</div>
            <div style="font-size:14px;color:#0f172a;line-height:1.8">${params.insights.coaching_tip}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function section(title: string, items: string[]) {
  const list = items.length ? items : ['لا توجد بيانات كافية لهذا القسم.']
  return `
    <div style="margin-top:18px">
      <h2 style="font-size:16px;color:#0f172a;margin:0 0 10px;font-weight:900">${title}</h2>
      <ul style="margin:0;padding:0 20px 0 0;color:#475569;font-size:14px;line-height:1.9">
        ${list.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `
}
