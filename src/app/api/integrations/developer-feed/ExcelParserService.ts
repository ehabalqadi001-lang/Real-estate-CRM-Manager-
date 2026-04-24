import { IngestionService } from './IngestionService'

export class ExcelParserService {
  /**
   * Auto-maps Arabic/English common Excel columns to our standard JSON schema
   */
  static normalizeRow(row: Record<string, any>) {
    const normalized: Record<string, any> = {}

    for (const [key, value] of Object.entries(row)) {
      const lowerKey = key.toLowerCase().trim()

      // Map Price
      if (lowerKey.includes('السعر') || lowerKey.includes('price')) {
        normalized['price'] = value
      } 
      // Map Unit Number
      else if (lowerKey.includes('رقم') || lowerKey.includes('unit')) {
        normalized['unit_number'] = value
      } 
      // Map Status
      else if (lowerKey.includes('حالة') || lowerKey.includes('status')) {
        const statusStr = String(value).toLowerCase()
        if (statusStr.includes('مباع') || statusStr.includes('sold')) {
          normalized['status'] = 'sold'
        } else if (statusStr.includes('محجوز') || statusStr.includes('reserved')) {
          normalized['status'] = 'reserved'
        } else {
          normalized['status'] = 'available'
        }
      } 
      // Map Project
      else if (lowerKey.includes('مشروع') || lowerKey.includes('project')) {
        normalized['project_name'] = value
      } else {
        // Keep original field for reference
        normalized[key] = value
      }
    }

    return normalized
  }

  /**
   * Processes raw Excel JSON array, normalizes it, and injects it into our standard mesh queue.
   */
  static async processExcelUpload(supabase: any, data: { developerId: string; companyId?: string; fileName: string; rows: Record<string, any>[] }) {
    // 1. Normalize mapping
    const mappedRows = data.rows.map(row => this.normalizeRow(row))

    // 2. Create ingestion batch & Queue
    const batch = await IngestionService.createBatch(supabase, { developerId: data.developerId, companyId: data.companyId, sourceType: 'excel', sourceName: data.fileName, totalRows: mappedRows.length })
    await IngestionService.queueRows(supabase, batch.id, mappedRows)
    return batch.id
  }
}
