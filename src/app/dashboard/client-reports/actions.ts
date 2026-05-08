'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'
import Anthropic from '@anthropic-ai/sdk'

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
    .select('*, client_id')
    .eq('id', reportId)
    .single()

  if (!report) return { error: 'التقرير غير موجود' }

  // In production: send via Resend (email) or WhatsApp API
  // For now: mark as sent
  const { error } = await supabase
    .from('client_reports')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', reportId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/client-reports')
  return { success: true }
}

export async function deleteReportAction(reportId: string) {
  await requirePermission('report.view.own')
  const supabase = await createRawClient()
  const { error } = await supabase.from('client_reports').delete().eq('id', reportId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/client-reports')
  return { success: true }
}
