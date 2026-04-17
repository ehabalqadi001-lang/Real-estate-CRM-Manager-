import 'server-only'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { ClientDealSummary, ClientDetail, ClientDetailResult, ClientListItem, ClientListResult } from './types'

export async function getClientList(): Promise<ClientListResult> {
  await requirePermission('client.view.assigned')
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, phone, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return { clients: [], error: error.message }
    }

    return { clients: (data ?? []) as ClientListItem[], error: null }
  } catch {
    return {
      clients: [],
      error: 'تعذر الاتصال بخادم قاعدة البيانات',
    }
  }
}

export async function getClientDetail(clientId: string): Promise<ClientDetailResult> {
  await requirePermission('client.view.assigned')
  const supabase = await createServerSupabaseClient()

  try {
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError) {
      return { client: null, deals: [], error: clientError.message }
    }

    const { data: dealsData, error: dealsError } = await supabase
      .from('deals')
      .select('id, title, compound, developer, developer_name, property_type, unit_value, amount, value, final_price, stage, status, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (dealsError) {
      return {
        client: clientData as ClientDetail,
        deals: [],
        error: dealsError.message,
      }
    }

    return {
      client: clientData as ClientDetail,
      deals: (dealsData ?? []) as ClientDealSummary[],
      error: null,
    }
  } catch {
    return {
      client: null,
      deals: [],
      error: 'تعذر الاتصال بخادم قاعدة البيانات',
    }
  }
}
