import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * POST /api/communications/calls/masked/start
 * Initiates a masked call between an Agent and a Client via Twilio.
 * The client sees TWILIO_MASKED_FROM_NUMBER, not the agent's real number.
 */
export async function POST(req: Request) {
  try {
    const { leadId, agentId, projectId } = await req.json()

    if (!leadId || !agentId) {
      return NextResponse.json({ error: 'Missing leadId or agentId' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken  = process.env.TWILIO_AUTH_TOKEN
    const maskedFrom = process.env.TWILIO_MASKED_FROM_NUMBER

    if (!accountSid || !authToken || !maskedFrom) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured — add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MASKED_FROM_NUMBER to env vars' },
        { status: 503 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch lead phone + agent phone in parallel
    const [leadRes, agentRes] = await Promise.all([
      supabase.from('leads').select('phone, full_name').eq('id', leadId).single(),
      supabase.from('user_profiles').select('phone, full_name').eq('id', agentId).single(),
    ])

    const leadPhone  = leadRes.data?.phone
    const agentPhone = agentRes.data?.phone

    if (!leadPhone)  return NextResponse.json({ error: 'Lead has no phone number' },  { status: 422 })
    if (!agentPhone) return NextResponse.json({ error: 'Agent has no phone number' }, { status: 422 })

    // Twilio TwiML: connect agent first, then dial lead
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${maskedFrom}">
    <Number>${leadPhone}</Number>
  </Dial>
</Response>`

    // Call Twilio REST API (no SDK needed — basic auth)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To:   agentPhone,
        From: maskedFrom,
        Twiml: twiml,
      }),
    })

    const twilioData = await twilioRes.json() as { sid?: string; status?: string; message?: string }

    if (!twilioRes.ok) {
      return NextResponse.json(
        { error: twilioData.message ?? 'Twilio call failed' },
        { status: twilioRes.status }
      )
    }

    // Log session to DB
    const { data: session, error: dbError } = await supabase
      .from('masked_call_sessions')
      .insert({
        lead_id:            leadId,
        agent_id:           agentId,
        project_id:         projectId ?? null,
        from_masked_number: maskedFrom,
        to_masked_number:   leadPhone,
        direction:          'agent_to_client',
        status:             'initiated',
        metadata:           { twilio_sid: twilioData.sid, twilio_status: twilioData.status },
      })
      .select('id')
      .single()

    if (dbError) throw dbError

    return NextResponse.json({
      success:   true,
      sessionId: session.id,
      twilioSid: twilioData.sid,
      status:    twilioData.status,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
