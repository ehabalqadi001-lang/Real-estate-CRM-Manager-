import 'server-only'

import { requireSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { LeadListFilters, LeadListItem, LeadListResult } from './types'

const ADMIN_ROLES = new Set([
  'super_admin',
  'platform_admin',
  'company_owner',
  'company_admin',
  'sales_director',
  'admin',
  'company',
])

function getCompanyScope(sessionCompanyId: string | null, userId: string, role: string) {
  if (sessionCompanyId) return sessionCompanyId
  return ADMIN_ROLES.has(role) ? userId : null
}

export async function getLeadList(filters: LeadListFilters = {}): Promise<LeadListResult> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const pageSize = filters.pageSize ?? 50
  const page = Math.max(1, filters.page ?? 1)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const role = session.profile.role
  const companyId = getCompanyScope(session.profile.company_id, session.user.id, role)

  let query = supabase
    .from('leads')
    .select('id, client_name, full_name, phone, status, expected_value, created_at, temperature, source, score', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (ADMIN_ROLES.has(role) && companyId) {
    query = query.or(`company_id.eq.${companyId},user_id.eq.${session.user.id}`)
  } else {
    query = query.or(`assigned_to.eq.${session.user.id},user_id.eq.${session.user.id}`)
  }

  if (filters.query) {
    query = query.or(`client_name.ilike.%${filters.query}%,phone.ilike.%${filters.query}%,full_name.ilike.%${filters.query}%`)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data: leads, count } = await query

  let kpiQuery = supabase
    .from('leads')
    .select('status, expected_value')

  if (ADMIN_ROLES.has(role) && companyId) {
    kpiQuery = kpiQuery.or(`company_id.eq.${companyId},user_id.eq.${session.user.id}`)
  } else {
    kpiQuery = kpiQuery.or(`assigned_to.eq.${session.user.id},user_id.eq.${session.user.id}`)
  }

  const { data: kpiData } = await kpiQuery
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)
  const rows = (leads ?? []) as LeadListItem[]
  const kpiRows = (kpiData ?? []) as Pick<LeadListItem, 'status' | 'expected_value'>[]

  return {
    leads: rows,
    totalCount,
    totalPages,
    page,
    from,
    to,
    kpis: {
      total: totalCount,
      fresh: kpiRows.filter((lead) => ['Fresh Leads', 'fresh'].includes(lead.status ?? '')).length,
      contracted: kpiRows.filter((lead) => lead.status === 'Contracted').length,
      totalValue: kpiRows.reduce((sum, lead) => sum + Number(lead.expected_value || 0), 0),
    },
  }
}

