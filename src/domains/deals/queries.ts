'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_PROBABILITY,
  type DealKanbanBoard,
  type DealListItem,
} from './types'

// ─── قائمة الصفقات للـ Kanban ────────────────────────────────────────
export async function getDealsKanban(): Promise<DealKanbanBoard> {
  await requireSession()

  const supabase = await createServerClient()
  const company_id = await getCompanyId()

  const { data, error } = await supabase
    .from('deals')
    .select(`
      id, stage, unit_value, probability, expected_close_date,
      actual_close_date, created_at, lead_id, unit_id, agent_id,
      company_id, notes,
      leads!lead_id ( client_name, phone ),
      profiles!agent_id ( full_name ),
      inventory!unit_id ( unit_name, unit_type, projects!project_id ( name ) )
    `)
    .eq('company_id', company_id)
    .not('stage', 'in', '("closed_won","closed_lost")')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDealsKanban error:', error.message)
    return { columns: [], totalPipelineValue: 0, totalDeals: 0 }
  }

  const deals = (data ?? []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    stage: d.stage as DealListItem['stage'],
    unit_value: d.unit_value as number | null,
    probability: (d.probability as number) ?? DEAL_STAGE_PROBABILITY[d.stage as keyof typeof DEAL_STAGE_PROBABILITY],
    expected_close_date: d.expected_close_date as string | null,
    actual_close_date: d.actual_close_date as string | null,
    created_at: d.created_at as string,
    lead_id: d.lead_id as string | null,
    unit_id: d.unit_id as string | null,
    agent_id: d.agent_id as string | null,
    company_id: d.company_id as string | null,
    notes: d.notes as string | null,
    client_name: (d.leads as Record<string, string> | null)?.client_name ?? null,
    client_phone: (d.leads as Record<string, string> | null)?.phone ?? null,
    agent_name: (d.profiles as Record<string, string> | null)?.full_name ?? null,
    unit_name: (d.inventory as Record<string, string> | null)?.unit_name ?? null,
    project_name: ((d.inventory as Record<string, Record<string, string> | null> | null)?.projects)?.name ?? null,
  })) as DealListItem[]

  const VISIBLE_STAGES = DEAL_STAGES.filter(s => s !== 'closed_won' && s !== 'closed_lost')

  const columns = VISIBLE_STAGES.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage)
    return {
      stage,
      label: DEAL_STAGE_LABELS[stage],
      deals: stageDeals,
      totalValue: stageDeals.reduce((sum, d) => sum + (d.unit_value ?? 0), 0),
    }
  })

  return {
    columns,
    totalPipelineValue: deals.reduce((sum, d) => sum + (d.unit_value ?? 0), 0),
    totalDeals: deals.length,
  }
}

// ─── تفاصيل صفقة واحدة ───────────────────────────────────────────────
export async function getDealDetail(dealId: string) {
  await requireSession()

  const supabase = await createServerClient()
  const company_id = await getCompanyId()

  const [dealRes, approvalsRes, stageLogRes] = await Promise.all([
    supabase
      .from('deals')
      .select(`
        *,
        leads!lead_id ( client_name, phone, status, score, temperature ),
        profiles!agent_id ( full_name, email ),
        inventory!unit_id (
          unit_name, unit_type, price, status, floor, area,
          projects!project_id ( name, location, developer_name )
        )
      `)
      .eq('id', dealId)
      .eq('company_id', company_id)
      .single(),

    supabase
      .from('deal_approvals')
      .select('*, profiles!approver_id ( full_name )')
      .eq('deal_id', dealId)
      .order('level'),

    supabase
      .from('deal_stage_log')
      .select('*, profiles!changed_by ( full_name )')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (dealRes.error) return null

  return {
    deal: dealRes.data,
    approvals: approvalsRes.data ?? [],
    stageLog: stageLogRes.data ?? [],
  }
}

// ─── ملخص الصفقات للـ Dashboard ──────────────────────────────────────
export async function getDealsSummary() {
  await requireSession()

  const supabase = await createServerClient()
  const company_id = await getCompanyId()

  const { data, error } = await supabase
    .rpc('get_deals_summary', { p_company_id: company_id })

  if (error) {
    console.error('getDealsSummary error:', error.message)
    return null
  }

  return data
}
