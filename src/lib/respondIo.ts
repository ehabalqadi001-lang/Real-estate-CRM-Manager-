import 'server-only'

export type RespondIoSendTextInput = {
  phone: string
  message: string
  channelType?: string
}

export type RespondIoSendTextResult = {
  messageId: string | null
  providerResponse: unknown
}

export class RespondIoError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'RespondIoError'
    this.status = status
    this.details = details
  }
}

const RESPOND_IO_API_BASE_URL = process.env.RESPOND_IO_API_BASE_URL ?? 'https://api.respond.io/v2'
const DEFAULT_CHANNEL_TYPE = process.env.RESPOND_IO_CHANNEL_TYPE ?? 'whatsapp'

export function normalizeRespondIoPhone(phone: string) {
  const trimmed = phone.trim()
  if (!trimmed) return ''

  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')

  if (!digits) return ''
  return hasPlus ? `+${digits}` : digits
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

  const message = record.message
  if (message && typeof message === 'object' && typeof (message as Record<string, unknown>).id === 'string') {
    return (message as Record<string, string>).id
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

export async function sendRespondIoTextMessage(input: RespondIoSendTextInput): Promise<RespondIoSendTextResult> {
  const token = process.env.RESPOND_IO_API_TOKEN
  if (!token) {
    throw new RespondIoError('RESPOND_IO_API_TOKEN is not configured.', 500)
  }

  const phone = normalizeRespondIoPhone(input.phone)
  const message = input.message.trim()

  if (!phone) {
    throw new RespondIoError('A valid destination phone number is required.', 400)
  }

  if (!message) {
    throw new RespondIoError('A text message is required.', 400)
  }

  const identifier = encodeURIComponent(`phone:${phone}`)
  const endpoint = `${RESPOND_IO_API_BASE_URL.replace(/\/$/, '')}/contact/${identifier}/message`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channelType: input.channelType ?? DEFAULT_CHANNEL_TYPE,
      message: {
        type: 'text',
        text: message,
      },
    }),
  })

  const payload = await parseJsonSafely(response)

  if (!response.ok) {
    throw new RespondIoError(
      getErrorMessage(payload, `Respond.io delivery failed with status ${response.status}.`),
      response.status,
      payload,
    )
  }

  return {
    messageId: getMessageId(payload),
    providerResponse: payload,
  }
}
