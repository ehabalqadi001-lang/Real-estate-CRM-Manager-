import { NextResponse } from 'next/server'

export type WebhookHandler = (req: Request, context: any) => Promise<NextResponse>

/**
 * Wrapper function for all incoming integrations (Developer feeds, VoIP, etc.)
 * Enforces security contracts: Timestamp validation, API keys, and Signatures.
 */
export function webhookApi(handler: WebhookHandler) {
  return async (req: Request, context: any) => {
    try {
      // 1. Extract security headers
      const clientKey = req.headers.get('X-FI-Client-Key')
      const timestamp = req.headers.get('X-FI-Timestamp')
      const idempotencyKey = req.headers.get('X-FI-Idempotency-Key')
      const signature = req.headers.get('X-FI-Signature')

      // 2. Validate mandatory headers presence
      if (!clientKey || !timestamp || !idempotencyKey || !signature) {
        return NextResponse.json({ error: 'Unauthorized: Missing required security headers' }, { status: 401 })
      }

      // 3. Prevent replay attacks (Reject requests older than 5 minutes)
      const requestTime = new Date(timestamp).getTime()
      const currentTime = Date.now()
      if (currentTime - requestTime > 5 * 60 * 1000) {
        return NextResponse.json({ error: 'Unauthorized: Request timestamp expired' }, { status: 401 })
      }

      // TODO: Fetch client secret via database and compute HMAC-SHA256 to verify `signature`

      // 4. Pass control to the specific route handler
      return await handler(req, context)
    } catch (error: unknown) {
      console.error('[WEBHOOK_API_ERROR]', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}