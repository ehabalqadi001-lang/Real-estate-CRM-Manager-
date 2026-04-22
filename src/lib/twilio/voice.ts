import 'server-only'

type CreateMaskedCallInput = {
  to: string
  from: string
  twimlUrl: string
  statusCallbackUrl: string
}

export type TwilioCallResult = {
  sid: string
  status: string
}

export function isTwilioVoiceConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_MASKED_FROM_NUMBER)
}

export async function createTwilioMaskedCall(input: CreateMaskedCallInput): Promise<TwilioCallResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) throw new Error('Twilio Voice غير مفعّل في إعدادات البيئة.')

  const body = new URLSearchParams()
  body.set('To', input.to)
  body.set('From', input.from)
  body.set('Url', input.twimlUrl)
  body.set('Method', 'POST')
  body.set('StatusCallback', input.statusCallbackUrl)
  body.set('StatusCallbackMethod', 'POST')
  body.append('StatusCallbackEvent', 'initiated')
  body.append('StatusCallbackEvent', 'ringing')
  body.append('StatusCallbackEvent', 'answered')
  body.append('StatusCallbackEvent', 'completed')

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.message ?? 'تعذر إنشاء مكالمة Twilio.')
  }

  return {
    sid: payload.sid,
    status: payload.status ?? 'queued',
  }
}

export function getPublicAppUrl(requestUrl?: string) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL

  if (configured) {
    const withProtocol = configured.startsWith('http') ? configured : `https://${configured}`
    return withProtocol.replace(/\/+$/, '')
  }

  if (requestUrl) {
    const url = new URL(requestUrl)
    return `${url.protocol}//${url.host}`
  }

  throw new Error('لا يوجد رابط عام للتطبيق لاستخدامه مع Twilio.')
}

export function normalizeEgyptPhoneToE164(phone: string | null | undefined) {
  const raw = String(phone ?? '').trim()
  if (!raw) return null
  if (raw.startsWith('+')) return raw.replace(/\s+/g, '')
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('20')) return `+${digits}`
  if (digits.startsWith('0')) return `+20${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('1')) return `+20${digits}`
  return `+${digits}`
}
