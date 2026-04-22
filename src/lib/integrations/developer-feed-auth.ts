import 'server-only'

import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export type DeveloperFeedClient = {
  id: string
  developer_id: string
  company_id: string | null
  client_key: string
  scopes: string[] | null
}

export type DeveloperFeedAuthResult =
  | { ok: true; client: DeveloperFeedClient }
  | { ok: false; status: number; error: string }

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

export async function verifyDeveloperFeedRequest(request: NextRequest, rawBody: string): Promise<DeveloperFeedAuthResult> {
  const clientKey = request.headers.get('x-fi-client-key')?.trim()
  const timestamp = request.headers.get('x-fi-timestamp')?.trim()
  const signature = request.headers.get('x-fi-signature')?.trim()

  if (!clientKey || !timestamp || !signature) {
    return { ok: false, status: 401, error: 'مفاتيح توقيع طلب المطور مطلوبة.' }
  }

  const timestampMs = Date.parse(timestamp)
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_CLOCK_SKEW_MS) {
    return { ok: false, status: 401, error: 'توقيت طلب المطور غير صالح أو خارج النافذة المسموحة.' }
  }

  const service = createServiceRoleClient()
  const { data: client, error } = await service
    .from('developer_api_clients')
    .select('id, developer_id, company_id, client_key, secret_ref, scopes, active, allowed_ips')
    .eq('client_key', clientKey)
    .eq('active', true)
    .maybeSingle()

  if (error) return { ok: false, status: 500, error: error.message }
  if (!client) return { ok: false, status: 401, error: 'مفتاح المطور غير معروف أو غير نشط.' }

  const secret = resolveSecret(String(client.secret_ref ?? ''))
  if (!secret) return { ok: false, status: 500, error: 'سر توقيع المطور غير مهيأ على الخادم.' }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  if (!safeEqual(signature, expected)) {
    return { ok: false, status: 401, error: 'توقيع طلب المطور غير صحيح.' }
  }

  await service.from('developer_api_clients').update({ last_used_at: new Date().toISOString() }).eq('id', client.id)

  return {
    ok: true,
    client: {
      id: client.id,
      developer_id: client.developer_id,
      company_id: client.company_id,
      client_key: client.client_key,
      scopes: client.scopes,
    },
  }
}

function resolveSecret(secretRef: string) {
  if (!secretRef) return null
  if (secretRef.startsWith('env:')) return process.env[secretRef.slice(4)] ?? null
  if (secretRef.startsWith('plain:')) return secretRef.slice(6)
  return process.env[secretRef] ?? null
}

function safeEqual(a: string, b: string) {
  try {
    const aBuffer = Buffer.from(a, 'hex')
    const bBuffer = Buffer.from(b, 'hex')
    if (aBuffer.length !== bBuffer.length) return false
    return crypto.timingSafeEqual(aBuffer, bBuffer)
  } catch {
    return false
  }
}
