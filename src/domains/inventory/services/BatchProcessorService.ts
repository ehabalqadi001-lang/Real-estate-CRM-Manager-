import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Domain Service for processing queued inventory ingestion batches.
 * Handles normalisation, upserts to projects/units, and records price history.
 */
export class BatchProcessorService {
  static async processBatch(supabaseAdmin: SupabaseClient, batchId: string) {
    // 1. Lock the batch by updating status to 'processing'
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('inventory_ingestion_batches')
      .update({ status: 'processing' })
      .eq('id', batchId)
      .eq('status', 'pending')
      .select('*')
      .single()
    
    if (batchError || !batch) {
      throw new Error('Batch not found or already processing')
    }

    // 2. Fetch pending rows for this batch
    const { data: rows } = await supabaseAdmin
      .from('inventory_ingestion_rows')
      .select('*')
      .eq('batch_id', batchId)
      .eq('status', 'pending')

    if (!rows || rows.length === 0) {
      await this.updateBatchStatus(supabaseAdmin, batchId, 'completed', 0, 0)
      return { success: true, processed: 0, failed: 0 }
    }

    let processed = 0
    let failed = 0

    // 3. Process each row sequentially (could be parallelized in the future)
    for (const row of rows) {
      try {
        await this.processRow(supabaseAdmin, batch.developer_id, batch.company_id, row)
        processed++
        await supabaseAdmin.from('inventory_ingestion_rows').update({ status: 'processed' }).eq('id', row.id)
      } catch (err: any) {
        failed++
        await supabaseAdmin.from('inventory_ingestion_rows').update({ status: 'failed', error_message: err.message }).eq('id', row.id)
      }
    }

    // 4. Finalize batch status based on results
    const finalStatus = failed === 0 ? 'completed' : processed === 0 ? 'failed' : 'partially_completed'
    await this.updateBatchStatus(supabaseAdmin, batchId, finalStatus, processed, failed)

    return { success: true, processed, failed, status: finalStatus }
  }

  private static async processRow(supabase: SupabaseClient, developerId: string | null, companyId: string | null, row: any) {
    const payload = row.raw_payload 
    
    const projectName = payload.project_name || 'Default Project'
    const unitNumber = payload.unit_number || payload.unit
    const price = payload.price ? parseFloat(payload.price) : null
    const status = payload.status || 'available'

    if (!unitNumber) throw new Error('Missing required field: unit_number')

    // 1. Find or create the project
    let { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('name', projectName)
      .eq('developer_id', developerId)
      .maybeSingle()
    
    if (!project) {
      const { data: newProject, error: projErr } = await supabase
        .from('projects')
        .insert({ name: projectName, developer_id: developerId })
        .select('id')
        .single()
      if (projErr) throw new Error(`Project Creation Failed: ${projErr.message}`)
      project = newProject
    }

    // 2. Upsert Unit & Record History
    const { data: existingUnit } = await supabase
      .from('units')
      .select('id, price, status')
      .eq('project_id', project.id)
      .eq('unit_number', unitNumber)
      .maybeSingle()

    if (existingUnit) {
      await supabase.from('units').update({ price, status, last_synced_at: new Date().toISOString() }).eq('id', existingUnit.id)
      
      if (existingUnit.price !== price || existingUnit.status !== status) {
        await supabase.from('unit_price_history').insert({
          unit_id: existingUnit.id, developer_id: developerId,
          old_price: existingUnit.price, new_price: price,
          old_status: existingUnit.status, new_status: status,
          source_type: 'api', batch_id: row.batch_id
        })
      }
    } else {
      await supabase.from('units').insert({
        project_id: project.id, unit_number: unitNumber, price, status, availability_source: 'api', last_synced_at: new Date().toISOString()
      })
    }
  }

  private static async updateBatchStatus(supabase: SupabaseClient, batchId: string, status: string, processed: number, failed: number) {
    await supabase.from('inventory_ingestion_batches').update({ status, processed_rows: processed, failed_rows: failed, completed_at: new Date().toISOString() }).eq('id', batchId)
  }
}