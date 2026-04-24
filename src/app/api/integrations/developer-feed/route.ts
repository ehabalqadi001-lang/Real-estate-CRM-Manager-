import { NextResponse } from 'next/server'
import { webhookApi } from '@/shared/api/webhookApi'
import { IngestionService } from '@/domains/inventory/services/IngestionService'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/integrations/developer-feed
 * Handles incoming unit updates, price changes, and availability status from developers.
 */
async function handler(req: Request) {
  const idempotencyKey = req.headers.get('X-FI-Idempotency-Key')
  const clientKey = req.headers.get('X-FI-Client-Key')
  
  const body = await req.json()
  const payloadRows = Array.isArray(body) ? body : [body]

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create batch and queue rows
  const batch = await IngestionService.createBatch(supabaseAdmin, {
    developerId: '00000000-0000-0000-0000-000000000000', // Mocked until clientKey mapping is built
    sourceType: 'api',
    sourceName: `Webhook Feed - ${new Date().toISOString()}`,
    totalRows: payloadRows.length
  })

  await IngestionService.queueRows(supabaseAdmin, batch.id, payloadRows)

  // Auto-Trigger background processor (Fire & Forget)
  // This starts processing the rows we just queued immediately
  const host = req.headers.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  
  fetch(`${baseUrl}/api/inventory/process-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchId: batch.id })
  }).catch((err) => console.error('[AUTO_TRIGGER_ERROR]', err))

  return NextResponse.json({
    success: true,
    message: 'Developer feed event received and queued successfully. Processing started.',
    idempotencyKey,
    batchId: batch.id
  }, { status: 202 })
}

export const POST = webhookApi(handler)