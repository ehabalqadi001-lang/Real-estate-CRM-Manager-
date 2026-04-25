import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/service'

/**
 * Bulk Inventory Import API (Phase 1: Stabilize Core Mesh)
 * Receives CSV files, creates an Ingestion Batch, and queues rows for background mapping.
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    // 1. Auth & Session Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized session' }, { status: 401 })
    }

    // 2. Extract File
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const service = createServiceRoleClient()

    // 3. Resolve user's company context
    const { data: profile } = await service.from('profiles').select('company_id').eq('id', user.id).single()

    // 4. Initialize the Ingestion Batch
    const { data: batch, error: batchError } = await service
      .from('inventory_ingestion_batches')
      .insert({
        company_id: profile?.company_id || null,
        source_type: file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
        source_name: file.name,
        status: 'pending',
        created_by: user.id
      })
      .select('id')
      .single()

    if (batchError || !batch) throw new Error('Failed to initialize ingestion batch')

    // 5. Parse File (Simplified CSV chunking)
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const headers = lines[0].split(',').map(h => h.trim())

    const rowsToInsert = lines.slice(1).map((line, index) => {
      const values = line.split(',')
      const payload: Record<string, string> = {}
      headers.forEach((h, i) => { payload[h] = values[i]?.trim() || '' })

      return { batch_id: batch.id, row_number: index + 1, raw_payload: payload, status: 'pending' }
    })

    // 6. Queue rows efficiently in background
    if (rowsToInsert.length > 0) {
      // Using bulk insert for large files (can be chunked later for 100k+ rows)
      await service.from('inventory_ingestion_rows').insert(rowsToInsert)
      await service.from('inventory_ingestion_batches').update({ total_rows: rowsToInsert.length }).eq('id', batch.id)
    }

    return NextResponse.json({ success: true, message: 'File imported and queued', batch_id: batch.id, rows: rowsToInsert.length }, { status: 202 })

  } catch (error: any) {
    console.error('[Inventory Import API] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error during import' }, { status: 500 })
  }
}