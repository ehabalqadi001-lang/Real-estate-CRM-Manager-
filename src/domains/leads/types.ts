export interface LeadListFilters {
  query?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface LeadListItem {
  id: string
  client_name: string | null
  full_name: string | null
  phone: string | null
  status: string | null
  expected_value: number | null
  created_at: string
  temperature: string | null
  source: string | null
  score: number | null
}

export interface LeadListKpis {
  total: number
  fresh: number
  contracted: number
  totalValue: number
}

export interface LeadListResult {
  leads: LeadListItem[]
  totalCount: number
  totalPages: number
  page: number
  from: number
  to: number
  kpis: LeadListKpis
}

