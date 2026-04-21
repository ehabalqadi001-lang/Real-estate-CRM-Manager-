import 'server-only'

import { createRawClient } from '@/lib/supabase/server'

export type WhatsAppDirection = 'inbound' | 'outbound'
export type WhatsAppMessageType = 'text' | 'template' | 'image' | 'document' | 'audio'
export type WhatsAppMessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface MessageResult {
  ok: boolean
  messageId: string | null
  status: WhatsAppMessageStatus
  providerResponse: unknown
  error?: string
}

export interface SendTextOptions {
  leadId?: string | null
  agentId?: string | null
  companyId?: string | null
  channelType?: string
}

export interface SendTemplateOptions extends SendTextOptions {
  language?: string
}

export interface WhatsAppTemplate {
  id: string
  name: string
  displayName: string
  category: string | null
  language: string
  bodyText: string
  variables: string[]
}

export class WhatsAppError extends Error {
  status: number
  details: unknown

  constructor(message: string, status = 500, details?: unknown) {
    super(message)
    this.name = 'WhatsAppError'
    this.status = status
    this.details = details
  }
}

const RESPOND_IO_API_BASE_URL = process.env.RESPOND_IO_API_BASE_URL ?? 'https://api.respond.io/v2'
const DEFAULT_CHANNEL_TYPE = process.env.RESPOND_IO_CHANNEL_TYPE ?? 'whatsapp'

export function normalizeWhatsAppPhone(phone: string) {
  const trimmed = phone.trim()
  if (!trimmed) return ''
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  return hasPlus ? `+${digits}` : digits
}

export function renderTemplate(bodyText: string, params: string[] | Record<string, string | number | null | undefined>, variables: string[]) {
  return bodyText.replace(/\{\{(\d+)\}\}/g, (_, index: string) => {
    const position = Number(index) - 1
    if (Array.isArray(params)) return String(params[position] ?? '')
    const key = variables[position]
    return String((key ? params[key] : '') ?? '')
  })
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (typeof record.error === 'string') return record.error
    if (record.error && typeof record.error === 'object') {
      const error = record.error as Record<string, unknown>
      if (typeof error.message === 'string') return error.message
    }
  }
  return fallback
}

function getMessageId(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (typeof record.id === 'string') return record.id
  if (typeof record.messageId === 'string') return record.messageId
  if (typeof record.mId === 'string') return record.mId
  if (record.message && typeof record.message === 'object') {
    const message = record.message as Record<string, unknown>
    if (typeof message.id === 'string') return message.id
  }
  return null
}

async function parseJsonSafely(response: Response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}

async function getCurrentMessagingContext(options: SendTextOptions) {
  if (options.companyId || options.agentId) return options

  const supabase = await createRawClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return options

  const [{ data: agent }, { data: profile }, { data: companyId }] = await Promise.all([
    supabase.from('agents').select('id, company_id').or(`id.eq.${user.id},email.eq.${user.email ?? ''}`).maybeSingle(),
    supabase.from('user_profiles').select('company_id').eq('id', user.id).maybeSingle(),
    supabase.rpc('current_company_id'),
  ])

  return {
    ...options,
    agentId: options.agentId ?? agent?.id ?? null,
    companyId: options.companyId ?? agent?.company_id ?? profile?.company_id ?? companyId ?? null,
  }
}

async function postRespondIoMessage(phone: string, message: Record<string, unknown>, channelType?: string) {
  const token = process.env.RESPOND_IO_API_TOKEN
  if (!token) throw new WhatsAppError('RESPOND_IO_API_TOKEN غير مضبوط في env.', 500)

  const normalizedPhone = normalizeWhatsAppPhone(phone)
  if (!normalizedPhone) throw new WhatsAppError('رقم واتساب غير صالح.', 400)

  const identifier = encodeURIComponent(`phone:${normalizedPhone}`)
  const endpoint = `${RESPOND_IO_API_BASE_URL.replace(/\/$/, '')}/contact/${identifier}/message`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channelType: channelType ?? DEFAULT_CHANNEL_TYPE,
      message,
    }),
  })

  const payload = await parseJsonSafely(response)
  if (!response.ok) {
    throw new WhatsAppError(getErrorMessage(payload, `فشل إرسال رسالة واتساب (${response.status}).`), response.status, payload)
  }

  return payload
}

async function storeMessage(input: {
  leadId?: string | null
  agentId?: string | null
  companyId?: string | null
  direction: WhatsAppDirection
  messageId?: string | null
  phone: string
  messageType: WhatsAppMessageType
  content?: string | null
  templateName?: string | null
  templateParams?: unknown
  status: WhatsAppMessageStatus
  providerPayload?: unknown
}) {
  const supabase = await createRawClient()
  await supabase.from('whatsapp_messages').insert({
    company_id: input.companyId ?? null,
    lead_id: input.leadId ?? null,
    agent_id: input.agentId ?? null,
    direction: input.direction,
    waba_message_id: input.messageId ?? null,
    phone_number: normalizeWhatsAppPhone(input.phone),
    message_type: input.messageType,
    content: input.content ?? null,
    template_name: input.templateName ?? null,
    template_params: input.templateParams ?? null,
    status: input.status,
    provider_payload: input.providerPayload ?? null,
    sent_at: new Date().toISOString(),
  })
}

export async function listWhatsAppTemplates() {
  const supabase = await createRawClient()
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .select('id, name, display_name, category, language, body_text, variables')
    .eq('active', true)
    .order('display_name')

  if (error) throw new WhatsAppError(error.message, 500)

  return (data ?? []).map((template): WhatsAppTemplate => ({
    id: template.id,
    name: template.name,
    displayName: template.display_name,
    category: template.category,
    language: template.language ?? 'ar',
    bodyText: template.body_text,
    variables: template.variables ?? [],
  }))
}

export async function getWhatsAppConversation(phone: string, limit = 50) {
  const supabase = await createRawClient()
  const normalizedPhone = normalizeWhatsAppPhone(phone)
  const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '')

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .in('phone_number', Array.from(new Set([normalizedPhone, phoneWithoutPlus])))
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new WhatsAppError(error.message, 500)
  return (data ?? []).reverse()
}

export async function sendText(phone: string, message: string, options: SendTextOptions = {}): Promise<MessageResult> {
  const normalizedPhone = normalizeWhatsAppPhone(phone)
  const content = message.trim()
  if (!content) throw new WhatsAppError('نص الرسالة مطلوب.', 400)

  const context = await getCurrentMessagingContext(options)
  try {
    const payload = await postRespondIoMessage(normalizedPhone, { type: 'text', text: content }, options.channelType)
    const messageId = getMessageId(payload)
    await storeMessage({
      ...context,
      direction: 'outbound',
      messageId,
      phone: normalizedPhone,
      messageType: 'text',
      content,
      status: 'sent',
      providerPayload: payload,
    })
    return { ok: true, messageId, status: 'sent', providerResponse: payload }
  } catch (error) {
    await storeMessage({
      ...context,
      direction: 'outbound',
      phone: normalizedPhone,
      messageType: 'text',
      content,
      status: 'failed',
      providerPayload: error instanceof WhatsAppError ? error.details : null,
    })
    throw error
  }
}

export async function sendTemplate(
  phone: string,
  templateName: string,
  params: string[] | Record<string, string | number | null | undefined>,
  options: SendTemplateOptions = {},
): Promise<MessageResult> {
  const supabase = await createRawClient()
  const { data: template, error } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .eq('name', templateName)
    .eq('active', true)
    .limit(1)
    .maybeSingle()

  if (error) throw new WhatsAppError(error.message, 500)
  if (!template) throw new WhatsAppError('القالب غير موجود أو غير مفعل.', 404)

  const variables = (template.variables ?? []) as string[]
  const rendered = renderTemplate(template.body_text, params, variables)
  const context = await getCurrentMessagingContext(options)
  const normalizedPhone = normalizeWhatsAppPhone(phone)

  try {
    const payload = await postRespondIoMessage(
      normalizedPhone,
      {
        type: 'template',
        template: {
          name: template.name,
          language: options.language ?? template.language ?? 'ar',
          parameters: Array.isArray(params) ? params : variables.map((variable) => params[variable] ?? ''),
        },
        text: rendered,
      },
      options.channelType,
    )
    const messageId = getMessageId(payload)
    await storeMessage({
      ...context,
      direction: 'outbound',
      messageId,
      phone: normalizedPhone,
      messageType: 'template',
      content: rendered,
      templateName,
      templateParams: params,
      status: 'sent',
      providerPayload: payload,
    })
    return { ok: true, messageId, status: 'sent', providerResponse: payload }
  } catch (error) {
    await storeMessage({
      ...context,
      direction: 'outbound',
      phone: normalizedPhone,
      messageType: 'template',
      content: rendered,
      templateName,
      templateParams: params,
      status: 'failed',
      providerPayload: error instanceof WhatsAppError ? error.details : null,
    })
    throw error
  }
}
