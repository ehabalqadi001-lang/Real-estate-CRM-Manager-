import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { getPublicAppUrl, createTwilioMaskedCall, isTwilioVoiceConfigured, normalizeEgyptPhoneToE164 } from '@/lib/twilio/voice'
import { nullableUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

type StartCallPayload = {
  leadId?: string
  developerId?: string
  projectId?: string
  developerUserId?: string
  direction?: 'agent_to_client' | 'developer_to_client' | 'client_to_agent' | 'client_to_developer'
  consentCaptured?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    const body = (await request.json()) as StartCallPayload
    const leadId = nullableUuid(body.leadId)
    const developerId = nullableUuid(body.developerId)
    const projectId = nullableUuid(body.projectId)
    const developerUserId = nullableUuid(body.developerUserId)

    if (!leadId) {
      return NextResponse.json({ error: 'اختر عميلاً صحيحاً قبل إنشاء المكالمة.' }, { status: 400 })
    }

    const service = createServiceRoleClient()
    const { data: lead, error: leadError } = await service
      .from('leads')
      .select('id, company_id, assigned_agent_id, agent_id, phone')
      .eq('id', leadId)
      .maybeSingle()

    if (leadError) throw leadError
    if (!lead) return NextResponse.json({ error: 'العميل غير موجود.' }, { status: 404 })

    const agentId = nullableUuid(lead.assigned_agent_id) ?? nullableUuid(lead.agent_id) ?? session.user.id
    const [{ data: profile }, { data: userProfile }] = await Promise.all([
      service.from('profiles').select('id, phone').eq('id', agentId).maybeSingle(),
      service.from('user_profiles').select('id, phone').eq('id', agentId).maybeSingle(),
    ])

    const agentPhone = normalizeEgyptPhoneToE164(profile?.phone ?? userProfile?.phone)
    const clientPhone = normalizeEgyptPhoneToE164(lead.phone)
    if (!agentPhone) return NextResponse.json({ error: 'لا يوجد رقم هاتف صالح للوكيل المسؤول عن المكالمة.' }, { status: 400 })
    if (!clientPhone) return NextResponse.json({ error: 'لا يوجد رقم هاتف صالح للعميل.' }, { status: 400 })

    const companyId = nullableUuid(lead.company_id) ?? nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)
    const fromMaskedNumber = process.env.TWILIO_MASKED_FROM_NUMBER ?? '+200000000000'
    const toMaskedNumber = process.env.TWILIO_MASKED_TO_NUMBER ?? fromMaskedNumber

    const { data: call, error } = await service
      .from('masked_call_sessions')
      .insert({
        company_id: companyId,
        developer_id: developerId,
        project_id: projectId,
        lead_id: leadId,
        agent_id: agentId,
        developer_user_id: developerUserId,
        from_masked_number: fromMaskedNumber,
        to_masked_number: toMaskedNumber,
        provider: 'twilio',
        direction: body.direction ?? 'agent_to_client',
        status: 'queued',
        recording_status: 'none',
        consent_captured: Boolean(body.consentCaptured),
        started_at: new Date().toISOString(),
      })
      .select('id, status, from_masked_number, to_masked_number')
      .single()

    if (error) throw error

    let providerStatus = call.status
    let providerCallSid: string | null = null
    let providerReady = isTwilioVoiceConfigured()

    if (providerReady) {
      const baseUrl = getPublicAppUrl(request.url)
      const secret = process.env.TWILIO_WEBHOOK_SECRET || process.env.COMMUNICATIONS_WEBHOOK_SECRET
      const secretQuery = secret ? `&secret=${encodeURIComponent(secret)}` : ''
      const webhookSecretQuery = secret ? `?secret=${encodeURIComponent(secret)}` : ''
      const twimlUrl = `${baseUrl}/api/communications/calls/masked/twiml?callId=${call.id}${secretQuery}`
      const statusCallbackUrl = `${baseUrl}/api/communications/calls/webhook${webhookSecretQuery}`
      const twilioCall = await createTwilioMaskedCall({
        to: agentPhone,
        from: fromMaskedNumber,
        twimlUrl,
        statusCallbackUrl,
      })

      providerStatus = twilioCall.status
      providerCallSid = twilioCall.sid

      await service
        .from('masked_call_sessions')
        .update({
          provider_call_sid: twilioCall.sid,
          status: normalizeCreatedCallStatus(twilioCall.status),
        })
        .eq('id', call.id)
    }

    await service.from('engagement_events').insert({
      company_id: companyId,
      lead_id: leadId,
      project_id: projectId,
      event_type: 'request_call',
      event_count: 1,
      metadata: {
        call_session_id: call.id,
        provider: 'twilio',
        provider_call_sid: providerCallSid,
        provider_ready: providerReady,
        mode: providerReady ? 'twilio_voice' : 'queued_without_provider',
      },
    })

    return NextResponse.json({
      success: true,
      callId: call.id,
      status: normalizeCreatedCallStatus(providerStatus),
      providerCallSid,
      fromMaskedNumber: call.from_masked_number,
      toMaskedNumber: call.to_masked_number,
      providerReady,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'تعذر إنشاء المكالمة المموهة.',
    }, { status: 500 })
  }
}

function normalizeCreatedCallStatus(status: string) {
  const value = status.toLowerCase()
  if (['initiated', 'queued'].includes(value)) return 'queued'
  if (value === 'ringing') return 'ringing'
  if (value === 'in-progress' || value === 'in_progress') return 'in_progress'
  if (['completed', 'busy', 'failed'].includes(value)) return value
  if (value === 'no-answer') return 'no_answer'
  return 'queued'
}
