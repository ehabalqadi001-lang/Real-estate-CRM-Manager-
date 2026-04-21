import 'server-only'

import { normalizeWhatsAppPhone, sendText, WhatsAppError } from '@/lib/whatsapp'

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

export function normalizeRespondIoPhone(phone: string) {
  return normalizeWhatsAppPhone(phone)
}

export async function sendRespondIoTextMessage(input: RespondIoSendTextInput): Promise<RespondIoSendTextResult> {
  try {
    const result = await sendText(input.phone, input.message, { channelType: input.channelType })
    return {
      messageId: result.messageId,
      providerResponse: result.providerResponse,
    }
  } catch (error) {
    if (error instanceof WhatsAppError) {
      throw new RespondIoError(error.message, error.status, error.details)
    }
    throw error
  }
}
