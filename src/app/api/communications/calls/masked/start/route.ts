import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/communications/calls/masked/start
 * Initiates a masked call between an Agent and a Client using Twilio.
 */
export async function POST(req: Request) {
  try {
    const { leadId, agentId, projectId } = await req.json()

    if (!leadId || !agentId) {
      return NextResponse.json({ error: 'Missing leadId or agentId' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: جلب رقم العميل الحقيقي ورقم الوكيل من قاعدة البيانات
    const agentPhone = '+201000000000' // Mocked for safety
    const leadPhone = '+201111111111'  // Mocked for safety

    // 1. تسجيل جلسة المكالمة في قاعدة البيانات وتعيين حالتها كـ "Queued"
    const { data: session, error } = await supabaseAdmin
      .from('masked_call_sessions')
      .insert({
        lead_id: leadId,
        agent_id: agentId,
        project_id: projectId || null,
        from_masked_number: '+1234567890', // الرقم الذي سيظهر للطرفين (Twilio Number)
        to_masked_number: leadPhone,
        direction: 'agent_to_client',
        status: 'queued'
      })
      .select('id')
      .single()

    if (error) throw error

    // TODO: استدعاء Twilio API لإنشاء الاتصال الفعلي (سيتم تنفيذه بعد إضافة مفاتيح Twilio)

    return NextResponse.json({ success: true, sessionId: session.id, message: 'Masked call initiated and logged successfully.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
