export interface DeveloperOption {
  id: string
  name: string
}

export interface InventoryUnitCard {
  id: string
  unit_name: string
  project_name: string
  unit_type: string
  price: number
  status: string
  floor?: number
  area?: number
  developer?: string
}

export interface InventoryOverview {
  units: InventoryUnitCard[]
  projects: string[]
  stats: {
    available: number
    reserved: number
    sold: number
    totalValue: number
    averagePrice: number
    soldRate: string
  }
  error: string | null
  errorDetails: string | null
}

export interface CreateInventoryUnitInput {
  unit_name: string
  developer_id: string
  unit_type: string
  price: number
  area_sqm?: number
  status?: string
  description?: string
}

export interface BulkInventoryUnitInput {
  developer_id: string
  rows: Record<string, unknown>[]
}
