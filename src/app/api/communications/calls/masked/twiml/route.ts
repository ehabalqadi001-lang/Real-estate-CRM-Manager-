import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getPublicAppUrl, normalizeEgyptPhoneToE164 } from '@/lib/twilio/voice'
import { nullableUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return handleTwiML(request)
}

export async function GET(request: NextRequest) {
  return handleTwiML(request)
}

async function handleTwiML(request: NextRequest) {
  try {
    const secret = process.env.TWILIO_WEBHOOK_SECRET || process.env.COMMUNICATIONS_WEBHOOK_SECRET
    const providedSecret = request.nextUrl.searchParams.get('secret')
    if (secret && providedSecret !== secret) {
      return xmlResponse('<Response><Reject reason="rejected" /></Response>', 401)
    }

    const callId = nullableUuid(request.nextUrl.searchParams.get('callId'))
    if (!callId) return xmlResponse('<Response><Reject reason="rejected" /></Response>', 400)

    const service = createServiceRoleClient()
    const { data: call, error: callError } = await service
      .from('masked_call_sessions')
      .select('id, lead_id, from_masked_number, direction')
      .eq('id', callId)
      .maybeSingle()

    if (callError) throw callError
    if (!call?.lead_id) return xmlResponse('<Response><Reject reason="rejected" /></Response>', 404)

    const { data: lead, error: leadError } = await service
      .from('leads')
      .select('id, phone')
      .eq('id', call.lead_id)
      .maybeSingle()

    if (leadError) throw leadError

    const clientPhone = normalizeEgyptPhoneToE164(lead?.phone)
    if (!clientPhone) {
      return xmlResponse('<Response><Say language="ar-EG">لا يوجد رقم هاتف صالح للعميل.</Say><Hangup /></Response>', 200)
    }

    const baseUrl = getPublicAppUrl(request.url)
    const callbackSecret = secret ? `?secret=${encodeURIComponent(secret)}` : ''
    const recordingCallback = `${baseUrl}/api/communications/calls/webhook${callbackSecret}`
    const twiml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Response>',
      `<Dial callerId="${escapeXml(call.from_masked_number)}" record="record-from-answer-dual" recordingStatusCallback="${escapeXml(recordingCallback)}" recordingStatusCallbackMethod="POST">`,
      `<Number>${escapeXml(clientPhone)}</Number>`,
      '</Dial>',
      '</Response>',
    ].join('')

    return xmlResponse(twiml)
  } catch {
    return xmlResponse('<Response><Say language="ar-EG">تعذر توصيل المكالمة.</Say><Hangup /></Response>', 500)
  }
}

function xmlResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
    },
  })
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
