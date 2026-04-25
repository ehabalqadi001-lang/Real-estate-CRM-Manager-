export interface ClientListItem {
  id: string
  name: string | null
  full_name?: string | null
  phone: string | null
  phone_country_code?: string | null
  nationality?: string | null
  investment_types?: string[] | null
  investment_locations?: string[] | null
  status: string | null
  created_at: string | null
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
  phone_country_code: string | null
  secondary_phone: string | null
  secondary_phone_country_code: string | null
  email: string | null
  national_id: string | null
  nationality: string | null
  residence_country: string | null
  source: string | null
  address: string | null
  client_type: string | null
  investment_types: string[] | null
  investment_budget: number | null
  payment_method: string | null
  investment_locations: string[] | null
  status: string | null
  created_at: string | null
}

export interface ClientDealSummary {
  id: string
  lead_id?: string | null
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

export interface ClientCallSummary {
  id: string
  lead_id: string | null
  provider_call_sid: string | null
  direction: string
  status: string
  duration_seconds: number | null
  recording_url: string | null
  recording_status: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export interface ClientDetailResult {
  client: ClientDetail | null
  deals: ClientDealSummary[]
  calls: ClientCallSummary[]
  error: string | null
}

export interface CreateClientInput {
  name: string
  phone: string
  phone_country_code?: string
  secondary_phone?: string | null
  secondary_phone_country_code?: string
  email?: string | null
  nationality?: string | null
  residence_country?: string | null
  investment_types?: string[]
  investment_budget?: number | null
  payment_method?: string | null
  investment_locations?: string[]
}
