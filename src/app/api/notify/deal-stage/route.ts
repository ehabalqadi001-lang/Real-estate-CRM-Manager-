import { NextRequest, NextResponse } from 'next/server'
import { sendDealStageChangedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
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
    await sendDealStageChangedEmail(body)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
