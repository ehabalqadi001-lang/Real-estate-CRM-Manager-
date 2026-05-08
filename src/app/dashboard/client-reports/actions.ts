'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

export async function createReportAction(formData: FormData) {
  await requirePermission('report.view.own')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const reportType     = (formData.get('report_type') as string) || 'weekly_insight'
  const title          = (formData.get('title') as string)?.trim()
  const clientId       = (formData.get('client_id') as string) || null
  const scheduledFor   = (formData.get('scheduled_for') as string) || null
  const deliveryChannel = (formData.get('delivery_channel') as string) || 'email'
  const context        = (formData.get('context') as string)?.trim()

  if (!title) return { error: 'عنوان التقرير مطلوب' }

  // Generate report content via Claude
  const REPORT_PROMPTS: Record<string, string> = {
    weekly_insight:       'Write a weekly real estate market insight report in Arabic.',
    investment_forecast:  'Write an investment forecast report for real estate in Arabic.',
    market_update:        'Write a real estate market update report in Arabic.',
    custom:               'Write a custom real estate report in Arabic.',
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `${REPORT_PROMPTS[reportType] ?? REPORT_PROMPTS.custom}

Report Title: ${title}
Context / Data: ${context || 'General Egyptian real estate market, Q2 2026'}

Structure the report with:
1. Executive Summary (2-3 sentences)
2. Market Overview
3. Key Highlights (3 bullet points)
4. Investment Recommendation
5. Outlook

Write in professional Arabic. Use HTML formatting for sections.`,
    }],
  })

  const contentHtml = message.content[0].type === 'text' ? message.content[0].text : ''

  const { data: inserted, error } = await supabase.from('client_reports').insert({
    company_id: companyId,
    client_id: clientId,
    report_type: reportType,
    title,
    content_html: contentHtml,
    scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    delivery_channel: deliveryChannel,
    created_by: user.id,
    status: scheduledFor ? 'scheduled' : 'draft',
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/client-reports')
  return { success: true, id: inserted?.id }
}

export async function sendReportAction(reportId: string) {
  await requirePermission('report.view.own')
  const supabase = await createRawClient()

  const { data: report } = await supabase
    .from('client_reports')
    .select('id, title, content_html, delivery_channel, client_id, company_id')
    .eq('id', reportId)
    .single()

  if (!report) return { error: 'التقرير غير موجود' }

  const channel = report.delivery_channel ?? 'email'
  let emailSent = false

  // ── Email via Resend ──────────────────────────────────────────
  if ((channel === 'email' || channel === 'both') && process.env.RESEND_API_KEY) {
    let clientEmail: string | null = null

    if (report.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('email')
        .eq('id', report.client_id)
        .single()
      clientEmail = (client as { email: string | null } | null)?.email ?? null
    }

    if (clientEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error: emailError } = await resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL ?? 'reports@fastinvestment.com',
        to:      clientEmail,
        subject: report.title ?? 'تقريرك الاستثماري من FAST INVESTMENT',
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafb; margin:0; padding:0; }
  .container { max-width:640px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; }
  .header { background:#0F8F83; padding:32px 24px; text-align:center; }
  .header h1 { color:#fff; margin:0; font-size:22px; }
  .body { padding:28px 24px; color:#102033; line-height:1.7; }
  .footer { background:#f0f4f8; padding:16px 24px; text-align:center; font-size:12px; color:#64748b; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>NEXUS Reports — FAST INVESTMENT</h1></div>
  <div class="body">
    <h2>${report.title}</h2>
    ${report.content_html ?? '<p>تم إعداد تقريرك الاستثماري. يرجى التواصل معنا للمزيد من التفاصيل.</p>'}
  </div>
  <div class="footer">هذا التقرير صادر من FAST INVESTMENT | للتواصل: info@fastinvestment.com</div>
</div>
</body></html>`,
      })
      if (!emailError) emailSent = true
    }
  }

  // ── WhatsApp via Meta API (if channel includes whatsapp) ─────
  if (channel === 'whatsapp' || channel === 'both') {
    // WhatsApp report delivery would use a pre-approved template
    // Marked as intent logged — actual send handled by WhatsApp action
  }

  const { error } = await supabase
    .from('client_reports')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', reportId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/client-reports')
  return { success: true, emailSent }
}

export async function deleteReportAction(reportId: string) {
  await requirePermission('report.view.own')
  const supabase = await createRawClient()
  const { error } = await supabase.from('client_reports').delete().eq('id', reportId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/client-reports')
  return { success: true }
}
