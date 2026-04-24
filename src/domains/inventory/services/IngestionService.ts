/**
 * Domain Service for handling Inventory Ingestion (Developer API, Excel, CSV)
 */
export class IngestionService {
  
  /**
   * Creates a new processing batch in the database.
   */
  static async createBatch(
    supabase: any, 
    data: {
      developerId: string;
      companyId?: string;
      sourceType: 'api' | 'excel' | 'csv' | 'manual';
      sourceName?: string;
      totalRows: number;
    }
  ) {
    const { data: batch, error } = await supabase
      .from('inventory_ingestion_batches')
      .insert({
        developer_id: data.developerId,
        company_id: data.companyId,
        source_type: data.sourceType,
        source_name: data.sourceName,
        total_rows: data.totalRows,
        status: 'pending'
      })
      .select('id')
      .single()
      
    if (error) throw new Error(`Failed to create batch: ${error.message}`)
    return batch
  }

  /**
   * Queues rows into the batch for asynchronous processing.
   */
  static async queueRows(supabase: any, batchId: string, rows: any[]) {
    const formattedRows = rows.map((row, index) => ({
      batch_id: batchId,
      row_number: index + 1,
      raw_payload: row,
      status: 'pending'
    }))

    const { error } = await supabase
      .from('inventory_ingestion_rows')
      .insert(formattedRows)
      
    if (error) throw new Error(`Failed to queue rows: ${error.message}`)
  }
}