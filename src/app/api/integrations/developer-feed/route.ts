import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { verifyDeveloperSignature } from '@/lib/api-security'

export async function POST(request: Request) {
  try {
    // 1. استخراج الترويسات الأمنية (الـ Middleware يتأكد من وجودها، ولكن نستخرجها هنا للمعالجة)
    const clientKey = request.headers.get('x-fi-client-key')
    const signature = request.headers.get('x-fi-signature')
    const timestamp = request.headers.get('x-fi-timestamp')
    const idempotencyKey = request.headers.get('x-fi-idempotency-key') || `req_${Date.now()}`

    if (!clientKey || !signature || !timestamp) {
      return NextResponse.json({ success: false, error: 'Missing security headers' }, { status: 401 })
    }

    const rawBody = await request.text()
    const service = createServiceRoleClient()

    // 2. التحقق من هوية المطور (حسب القسم 5 من الهيكل المعماري)
    const { data: apiClient, error: clientError } = await service
      .from('developer_api_clients')
      .select('id, developer_id, company_id, secret_ref, active')
      .eq('client_key', clientKey)
      .single()

    if (clientError || !apiClient || !apiClient.active) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive Developer API client key' },
        { status: 401 }
      )
    }

    // 3. التحقق من التوقيع المشفّر (HMAC) لمنع التلاعب بالأسعار
    const signatureCheck = verifyDeveloperSignature(rawBody, timestamp, signature, apiClient.secret_ref)
    if (!signatureCheck.valid) {
      return NextResponse.json(
        { success: false, error: `Signature verification failed: ${signatureCheck.reason}` },
        { status: 401 }
      )
    }

    // 4. معالجة البيانات الواردة (Payload Parsing)
    const payload = JSON.parse(rawBody)
    const items = Array.isArray(payload) ? payload : [payload]

    // 5. إنشاء دفعة المعالجة (حسب القسم 10: Ingestion Flow)
    const { data: batch, error: batchError } = await service
      .from('inventory_ingestion_batches')
      .insert({
        developer_id: apiClient.developer_id,
        company_id: apiClient.company_id,
        source_type: 'api',
        source_name: `API_Sync_${idempotencyKey}`,
        status: 'pending',
        total_rows: items.length,
      })
      .select('id')
      .single()

    if (batchError || !batch) throw new Error('Failed to initialize ingestion batch')

    // 6. إدراج صفوف المخزون الواردة ليتم معالجتها لاحقاً (Background Processing)
    const rowsToInsert = items.map((item, index) => ({
      batch_id: batch.id,
      row_number: index + 1,
      raw_payload: item,
      status: 'pending'
    }))

    const { error: rowsError } = await service.from('inventory_ingestion_rows').insert(rowsToInsert)
    if (rowsError) throw new Error('Failed to queue inventory rows')

    // 7. الرد بالقبول الناجح (202 Accepted)
    return NextResponse.json({
      success: true,
      message: 'Inventory payload received and queued successfully',
      batch_id: batch.id,
      rows_queued: items.length
    }, { status: 202 })

  } catch (error: any) {
    console.error('[API Gateway] Ingestion Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error during inventory ingestion' },
      { status: 500 }
    )
  }
}