import { PipelineBoard, normalizeStage, type DealActivityItem, type PipelineAgentOption, type PipelineDeal, type PipelineLeadOption, type PipelineUnitOption } from '@/components/pipeline/PipelineBoard'
import type { Deal, Lead, Profile, Unit } from '@/lib/types/db'
import { requireSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { addDealActivity, createPipelineDeal, updatePipelineDeal, updatePipelineDealStage } from './actions'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()
  const companyId = session.profile.company_id ?? session.user.id
  const canAssignAgents = ['super_admin', 'admin', 'company_admin', 'company', 'branch_manager', 'senior_agent'].includes(session.profile.role)

  const [deals, leads, units, agents, activities] = await Promise.all([
    getDeals(supabase, companyId),
    getLeads(supabase, companyId),
    getUnits(supabase, companyId),
    getAgents(supabase, companyId),
    getDealActivities(supabase),
  ])

  return (
    <main className="sales-command px-3 py-4 sm:px-4 lg:px-6" dir="ltr">
      <PipelineBoard
        initialDeals={deals}
        leads={leads}
        units={units}
        agents={agents}
        activities={activities}
        canAssignAgents={canAssignAgents}
        userRole={session.profile.role}
        userName={session.profile.full_name ?? session.profile.email ?? 'FAST INVESTMENT'}
        onStageChange={updatePipelineDealStage}
        onCreateDeal={createPipelineDeal}
        onUpdateDeal={updatePipelineDeal}
        onAddActivity={addDealActivity}
      />
    </main>
  )
}

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>

async function getDeals(supabase: ServerSupabase, companyId: string | null): Promise<PipelineDeal[]> {
  let query = supabase
    .from('deals')
    .select('id, lead_id, unit_id, agent_id, stage, title, client_name, buyer_name, project_name, value, amount, unit_value, final_price, expected_close_date, notes, created_at, updated_at, company_id')
    .order('created_at', { ascending: false })
    .limit(500)

  if (companyId) query = query.eq('company_id', companyId)

  const { data } = await query
  const rows = (data ?? []) as unknown as Deal[]
  const leadIds = Array.from(new Set(rows.map((deal) => deal.lead_id).filter(Boolean))) as string[]
  const unitIds = Array.from(new Set(rows.map((deal) => deal.unit_id).filter(Boolean))) as string[]
  const agentIds = Array.from(new Set(rows.map((deal) => deal.agent_id).filter(Boolean))) as string[]

  const [leadMap, unitMap, agentMap] = await Promise.all([
    getLeadMap(supabase, leadIds),
    getUnitMap(supabase, unitIds),
    getAgentMap(supabase, agentIds),
  ])

  return rows.map((deal) => {
    const lead = deal.lead_id ? leadMap.get(deal.lead_id) : null
    const unit = deal.unit_id ? unitMap.get(deal.unit_id) : null
    const agent = deal.agent_id ? agentMap.get(deal.agent_id) : null
    const value = Number(deal.final_price ?? deal.unit_value ?? deal.value ?? deal.amount ?? unit?.price ?? 0)

    return {
      id: deal.id,
      leadId: deal.lead_id,
      unitId: deal.unit_id,
      agentId: deal.agent_id,
      stage: normalizeStage(deal.stage ?? 'new'),
      title: deal.title ?? lead?.name ?? deal.client_name ?? deal.buyer_name ?? 'صفقة عقارية',
      clientName: lead?.name ?? deal.client_name ?? deal.buyer_name ?? deal.title ?? 'عميل غير محدد',
      projectName: unit?.projectName ?? deal.project_name ?? '',
      unitName: unit?.label ?? deal.project_name ?? '',
      value,
      expectedCloseDate: deal.expected_close_date ?? null,
      notes: deal.notes,
      agentName: agent?.name ?? 'غير معين',
      createdAt: deal.created_at,
      updatedAt: deal.updated_at ?? null,
    }
  })
}

async function getLeads(supabase: ServerSupabase, companyId: string | null): Promise<PipelineLeadOption[]> {
  let query = supabase
    .from('leads')
    .select('id, client_name, full_name, name, phone, company_id')
    .order('created_at', { ascending: false })
    .limit(500)

  if (companyId) query = query.eq('company_id', companyId)
  const { data } = await query

  return ((data ?? []) as unknown as Lead[]).map((lead) => ({
    id: lead.id,
    name: lead.client_name ?? lead.full_name ?? lead.name ?? 'عميل بدون اسم',
    phone: lead.phone,
  }))
}

async function getUnits(supabase: ServerSupabase, companyId: string | null): Promise<PipelineUnitOption[]> {
  let query = supabase
    .from('units')
    .select('id, unit_number, unit_type, price, project_id, company_id')
    .order('created_at', { ascending: false })
    .limit(500)

  if (companyId) query = query.eq('company_id', companyId)
  const { data } = await query
  const rows = (data ?? []) as unknown as Unit[]
  const projectIds = Array.from(new Set(rows.map((unit) => unit.project_id).filter(Boolean))) as string[]
  const projectNames = await getProjectNames(supabase, projectIds)

  return rows.map((unit) => ({
    id: unit.id,
    label: [unit.unit_type, unit.unit_number].filter(Boolean).join(' - ') || 'وحدة',
    projectName: unit.project_id ? projectNames.get(unit.project_id) ?? 'مشروع' : 'مشروع',
    price: Number(unit.price ?? 0),
  }))
}

async function getAgents(supabase: ServerSupabase, companyId: string | null): Promise<PipelineAgentOption[]> {
  let query = supabase
    .from('profiles')
    .select('id, full_name, role, company_id')
    .in('role', ['agent', 'broker', 'senior_agent', 'branch_manager', 'company_admin', 'admin'])
    .limit(200)

  if (companyId) query = query.eq('company_id', companyId)
  const { data } = await query

  return ((data ?? []) as unknown as Profile[]).map((profile) => ({
    id: profile.id,
    name: profile.full_name ?? 'عضو فريق',
  }))
}

async function getDealActivities(supabase: ServerSupabase): Promise<DealActivityItem[]> {
  const { data } = await supabase
    .from('deal_activities')
    .select('id, deal_id, action, note, created_at')
    .order('created_at', { ascending: false })
    .limit(300)

  return (data ?? []).map((activity) => ({
    id: activity.id,
    dealId: activity.deal_id,
    action: activity.action,
    note: activity.note,
    createdAt: activity.created_at,
  }))
}

async function getLeadMap(supabase: ServerSupabase, ids: string[]) {
  if (ids.length === 0) return new Map<string, PipelineLeadOption>()
  const { data } = await supabase
    .from('leads')
    .select('id, client_name, full_name, name, phone')
    .in('id', ids)
  return new Map(((data ?? []) as unknown as Lead[]).map((lead) => [lead.id, {
    id: lead.id,
    name: lead.client_name ?? lead.full_name ?? lead.name ?? 'عميل بدون اسم',
    phone: lead.phone,
  }]))
}

async function getUnitMap(supabase: ServerSupabase, ids: string[]) {
  if (ids.length === 0) return new Map<string, PipelineUnitOption>()
  const { data } = await supabase
    .from('units')
    .select('id, unit_number, unit_type, price, project_id')
    .in('id', ids)
  const units = (data ?? []) as unknown as Unit[]
  const projectIds = Array.from(new Set(units.map((unit) => unit.project_id).filter(Boolean))) as string[]
  const projectNames = await getProjectNames(supabase, projectIds)
  return new Map(units.map((unit) => [unit.id, {
    id: unit.id,
    label: [unit.unit_type, unit.unit_number].filter(Boolean).join(' - ') || 'وحدة',
    projectName: unit.project_id ? projectNames.get(unit.project_id) ?? 'مشروع' : 'مشروع',
    price: Number(unit.price ?? 0),
  }]))
}

async function getAgentMap(supabase: ServerSupabase, ids: string[]) {
  if (ids.length === 0) return new Map<string, PipelineAgentOption>()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids)
  return new Map(((data ?? []) as unknown as Profile[]).map((profile) => [profile.id, {
    id: profile.id,
    name: profile.full_name ?? 'عضو فريق',
  }]))
}

async function getProjectNames(supabase: ServerSupabase, ids: string[]) {
  if (ids.length === 0) return new Map<string, string>()
  const { data } = await supabase
    .from('projects')
    .select('id, name')
    .in('id', ids)
  return new Map((data ?? []).map((project) => [project.id, project.name]))
}
