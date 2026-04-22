import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
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

    const supabase = await createServerSupabaseClient()
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, company_id, assigned_agent_id, agent_id')
      .eq('id', leadId)
      .maybeSingle()

    if (leadError) throw leadError
    if (!lead) return NextResponse.json({ error: 'العميل غير موجود.' }, { status: 404 })

    const companyId = nullableUuid(lead.company_id) ?? nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)
    const fromMaskedNumber = process.env.TWILIO_MASKED_FROM_NUMBER ?? '+200000000000'
    const toMaskedNumber = process.env.TWILIO_MASKED_TO_NUMBER ?? '+200000000001'

    const { data: call, error } = await supabase
      .from('masked_call_sessions')
      .insert({
        company_id: companyId,
        developer_id: developerId,
        project_id: projectId,
        lead_id: leadId,
        agent_id: nullableUuid(lead.assigned_agent_id) ?? nullableUuid(lead.agent_id) ?? session.user.id,
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

    await supabase.from('engagement_events').insert({
      company_id: companyId,
      lead_id: leadId,
      project_id: projectId,
      event_type: 'request_call',
      event_count: 1,
      metadata: { call_session_id: call.id, provider: 'twilio', mode: 'masked_mvp' },
    })

    return NextResponse.json({
      success: true,
      callId: call.id,
      status: call.status,
      fromMaskedNumber: call.from_masked_number,
      toMaskedNumber: call.to_masked_number,
      providerReady: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'تعذر إنشاء المكالمة المموهة.',
    }, { status: 500 })
  }
}
