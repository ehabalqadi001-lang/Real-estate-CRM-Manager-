import { NextResponse, type NextRequest } from 'next/server'
import { sendRespondIoTextMessage, normalizeRespondIoPhone, RespondIoError } from '@/lib/respondIo'
import { createRawClient } from '@/lib/supabase/server'
import { getCurrentSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'

export const runtime = 'nodejs'

type SendWhatsAppPayload = {
  phone?: string
  to?: string
  message?: string
  text?: string
  userId?: string | null
}

async function logWhatsAppAttempt(input: {
  phone: string
  message: string
  status: 'sent' | 'failed'
  messageId?: string | null
  userId?: string | null
  failedReason?: string | null
}) {
  try {
    const supabase = await createRawClient()
    await supabase.from('whatsapp_logs').insert({
      recipient_phone: input.phone,
      message: input.message,
      status: input.status,
      provider: 'respond.io',
      provider_msg_id: input.messageId ?? null,
      message_id: input.messageId ?? null,
      user_id: input.userId ?? null,
      failed_reason: input.failedReason ?? null,
      sent_at: input.status === 'sent' ? new Date().toISOString() : null,
    })
  } catch {
    // Logging must not mask the delivery result returned to the caller.
  }
}

export async function POST(request: NextRequest) {
  const internalToken = request.headers.get('x-fast-investment-internal-token')
  const isInternalRequest = Boolean(
    internalToken &&
    process.env.RESPOND_IO_API_TOKEN &&
    internalToken === process.env.RESPOND_IO_API_TOKEN,
  )

  if (!isInternalRequest) {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (!hasPermission(session.profile.role, 'messages.whatsapp')) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }
  }

  let body: SendWhatsAppPayload
  try {
    body = (await request.json()) as SendWhatsAppPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const phone = normalizeRespondIoPhone(body.phone ?? body.to ?? '')
  const message = (body.message ?? body.text ?? '').trim()

  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message are required.' }, { status: 400 })
  }

  try {
    const result = await sendRespondIoTextMessage({ phone, message })
    await logWhatsAppAttempt({
      phone,
      message,
      status: 'sent',
      messageId: result.messageId,
      userId: body.userId ?? null,
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    const status = error instanceof RespondIoError ? error.status : 500
    const details = error instanceof RespondIoError ? error.details : null
    const errorMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp message.'

    await logWhatsAppAttempt({
      phone,
      message,
      status: 'failed',
      userId: body.userId ?? null,
      failedReason: errorMessage,
    })

    return NextResponse.json(
      {
        error: errorMessage,
        details,
      },
      { status: status >= 400 && status < 600 ? status : 500 },
    )
  }
}
