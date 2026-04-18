import { NextRequest, NextResponse } from 'next/server'
import { sendDealStageChangedEmail } from '@/lib/email'
import { createRawClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Auth guard — only authenticated users can trigger deal-stage notifications
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as {
      to: string
      agentName: string
      clientName: string
      dealTitle: string
      oldStage: string
      newStage: string
      dealId: string
    }

    if (!body.to || !body.dealId) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    await sendDealStageChangedEmail(body)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
