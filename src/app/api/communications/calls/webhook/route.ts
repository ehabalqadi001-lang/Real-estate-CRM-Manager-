import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { nullableUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

type CallWebhookPayload = {
  callId?: string
  CallSid?: string
  callSid?: string
  CallStatus?: string
  callStatus?: string
  RecordingUrl?: string
  recordingUrl?: string
  RecordingStatus?: string
  recordingStatus?: string
  CallDuration?: string
  duration?: string | number
}

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.TWILIO_WEBHOOK_SECRET || process.env.COMMUNICATIONS_WEBHOOK_SECRET
    if (configuredSecret) {
      const providedSecret = request.headers.get('x-fast-investment-webhook-secret') ?? request.nextUrl.searchParams.get('secret')
      if (providedSecret !== configuredSecret) {
        return NextResponse.json({ error: 'غير مصرح باستقبال تحديث المكالمة.' }, { status: 401 })
      }
    }

    const contentType = request.headers.get('content-type') ?? ''
    const body = contentType.includes('application/json')
      ? ((await request.json()) as CallWebhookPayload)
      : Object.fromEntries((await request.formData()).entries()) as CallWebhookPayload

    const callId = nullableUuid(String(body.callId ?? ''))
    const providerCallSid = String(body.CallSid ?? body.callSid ?? '').trim()
    if (!callId && !providerCallSid) {
      return NextResponse.json({ error: 'معرف المكالمة أو معرف المزوّد مطلوب.' }, { status: 400 })
    }

    const providerStatus = String(body.CallStatus ?? body.callStatus ?? 'queued')
    const status = normalizeProviderStatus(providerStatus)
    const recordingStatus = normalizeRecordingStatus(String(body.RecordingStatus ?? body.recordingStatus ?? 'none'))
    const durationSeconds = Number(body.CallDuration ?? body.duration ?? 0) || 0
    const recordingUrl = String(body.RecordingUrl ?? body.recordingUrl ?? '').trim() || null

    const service = createServiceRoleClient()
    const updates = {
      provider_call_sid: providerCallSid || undefined,
      status,
      duration_seconds: durationSeconds,
      recording_url: recordingUrl,
      recording_status: recordingUrl ? 'available' : recordingStatus,
      ended_at: ['completed', 'failed', 'no_answer', 'busy'].includes(status) ? new Date().toISOString() : undefined,
    }

    const query = service
      .from('masked_call_sessions')
      .update(updates)
      .select('id, company_id, lead_id, project_id, status')

    const { data: call, error } = callId
      ? await query.eq('id', callId).single()
      : await query.eq('provider_call_sid', providerCallSid).single()

    if (error) throw error

    await service.from('engagement_events').insert({
      company_id: call.company_id,
      lead_id: call.lead_id,
      project_id: call.project_id,
      event_type: 'request_call',
      event_count: 1,
      metadata: {
        call_session_id: call.id,
        provider: 'twilio',
        provider_call_sid: providerCallSid || null,
        status,
        webhook_event: status === 'completed' ? 'call_completed' : 'call_status_changed',
        duration_seconds: durationSeconds,
      },
    })

    return NextResponse.json({ success: true, callId: call.id, status: call.status })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'تعذر تحديث حالة المكالمة.',
    }, { status: 500 })
  }
}

function normalizeProviderStatus(status: string) {
  const value = status.toLowerCase()
  if (['initiated', 'queued'].includes(value)) return 'queued'
  if (['ringing'].includes(value)) return 'ringing'
  if (['in-progress', 'in_progress', 'answered'].includes(value)) return 'in_progress'
  if (['completed'].includes(value)) return 'completed'
  if (['busy'].includes(value)) return 'busy'
  if (['no-answer', 'no_answer'].includes(value)) return 'no_answer'
  return 'failed'
}

function normalizeRecordingStatus(status: string) {
  const value = status.toLowerCase()
  if (value === 'completed') return 'available'
  if (value === 'in-progress' || value === 'in_progress') return 'processing'
  if (value === 'absent') return 'failed'
  if (['processing', 'available', 'failed'].includes(value)) return value
  return 'none'
}
