export interface ClientListItem {
  id: string
  name: string | null
  phone: string | null
  status: string | null
  created_at: string
}

export interface ClientListResult {
  clients: ClientListItem[]
  error: string | null
}

export interface ClientDetail {
  id: string
  name: string | null
  full_name: string | null
  phone: string | null
  national_id: string | null
  source: string | null
  address: string | null
  client_type: string | null
}

export interface ClientDealSummary {
  id: string
  title: string | null
  compound: string | null
  developer: string | null
  developer_name: string | null
  property_type: string | null
  unit_value: number | null
  amount: number | null
  value: number | null
  final_price: number | null
  stage: string | null
  status: string | null
  created_at: string | null
}

export interface ClientDetailResult {
  client: ClientDetail | null
  deals: ClientDealSummary[]
  error: string | null
}

export interface CreateClientInput {
  name: string
  phone: string
  email?: string | null
}
