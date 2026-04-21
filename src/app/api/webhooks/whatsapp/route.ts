import { NextResponse, type NextRequest } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'
import { normalizeWhatsAppPhone } from '@/lib/whatsapp'

export const runtime = 'nodejs'

type RespondIoWebhookEvent = {
  type?: string
  mId?: string
  messageId?: string
  timestamp?: number
  message?: {
    type?: string
    text?: string
    attachment?: {
      type?: string
      url?: string
      fileName?: string
    }
  }
  status?: {
    value?: string
    message?: string
  }
}

type RespondIoWebhookPayload = {
  channelId?: string
  contactId?: string
  events?: RespondIoWebhookEvent[]
  contact?: {
    phone?: string
    firstName?: string
    lastName?: string
  }
  event?: string
  message?: RespondIoWebhookEvent['message'] & { id?: string; status?: string }
  phone?: string
}

async function verifySignature(request: NextRequest, rawBody: string) {
  const secret = process.env.RESPOND_IO_WEBHOOK_SECRET
  if (!secret) return true

  const signature = request.headers.get('x-respondio-signature')
    ?? request.headers.get('x-signature')
    ?? request.headers.get('x-hub-signature-256')

  if (!signature) return false

  const normalizedSignature = signature.replace(/^sha256=/, '')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const expected = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')

  return timingSafeEqual(expected, normalizedSignature)
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return result === 0
}

function getEventMessageType(event: RespondIoWebhookEvent) {
  const type = event.message?.type
  if (type === 'image' || event.message?.attachment?.type === 'image') return 'image'
  if (type === 'audio' || event.message?.attachment?.type === 'audio') return 'audio'
  if (type === 'document' || type === 'attachment') return 'document'
  return 'text'
}

function getEventContent(event: RespondIoWebhookEvent) {
  if (event.message?.text) return event.message.text
  if (event.message?.attachment?.url) return event.message.attachment.url
  if (event.status?.message) return event.status.message
  return ''
}

async function findLeadByPhone(phone: string) {
  const supabase = await createRawClient()
  const normalized = normalizeWhatsAppPhone(phone)
  const withoutPlus = normalized.replace(/^\+/, '')
  const { data } = await supabase
    .from('leads')
    .select('id, company_id, user_id, assigned_to, client_name, full_name, name')
    .or(`phone.eq.${normalized},phone.eq.${withoutPlus},whatsapp.eq.${normalized},whatsapp.eq.${withoutPlus}`)
    .limit(1)
    .maybeSingle()

  return data
}

async function createInboundNotification(lead: Awaited<ReturnType<typeof findLeadByPhone>>, content: string) {
  if (!lead?.user_id) return
  const supabase = await createRawClient()
  const clientName = lead.client_name ?? lead.full_name ?? lead.name ?? 'عميل'
  await supabase.from('notifications').insert({
    user_id: lead.user_id,
    company_id: lead.company_id ?? null,
    type: 'mention',
    title: 'رسالة واتساب جديدة',
    message: `رسالة جديدة من ${clientName}`,
    body: content,
    related_entity_id: lead.id,
    is_read: false,
  })
}

async function storeInboundMessage(phone: string, event: RespondIoWebhookEvent, providerPayload: unknown) {
  const supabase = await createRawClient()
  const lead = await findLeadByPhone(phone)
  const content = getEventContent(event)

  await supabase.from('whatsapp_messages').upsert({
    company_id: lead?.company_id ?? null,
    lead_id: lead?.id ?? null,
    direction: 'inbound',
    waba_message_id: event.mId ?? event.messageId ?? null,
    phone_number: normalizeWhatsAppPhone(phone),
    message_type: getEventMessageType(event),
    content,
    status: 'delivered',
    delivered_at: new Date(event.timestamp ?? Date.now()).toISOString(),
    provider_payload: providerPayload,
  }, { onConflict: 'waba_message_id' })

  await createInboundNotification(lead, content)
}

async function updateMessageStatus(event: RespondIoWebhookEvent) {
  const id = event.mId ?? event.messageId
  const value = event.status?.value
  if (!id || !value || !['sent', 'delivered', 'read', 'failed'].includes(value)) return

  const timestamp = new Date(event.timestamp ?? Date.now()).toISOString()
  const supabase = await createRawClient()
  await supabase
    .from('whatsapp_messages')
    .update({
      status: value,
      delivered_at: value === 'delivered' ? timestamp : undefined,
      read_at: value === 'read' ? timestamp : undefined,
    })
    .eq('waba_message_id', id)
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const isVerified = await verifySignature(request, rawBody)
  if (!isVerified) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  let payload: RespondIoWebhookPayload
  try {
    payload = JSON.parse(rawBody) as RespondIoWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const phone = payload.contact?.phone ?? payload.phone ?? payload.contactId ?? ''
  const events = payload.events ?? (payload.message ? [{ type: payload.event, mId: payload.message.id, message: payload.message }] : [])

  for (const event of events) {
    if (event.type === 'message_status') {
      await updateMessageStatus(event)
    } else if (event.type === 'message' || event.type === 'message.received' || event.message) {
      await storeInboundMessage(phone, event, payload)
    }
  }

  return NextResponse.json({ ok: true })
}
