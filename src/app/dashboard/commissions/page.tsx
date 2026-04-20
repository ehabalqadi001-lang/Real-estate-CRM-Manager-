import { CommissionsDashboard } from '@/components/commissions/CommissionsDashboard'
import type { CommissionLeadOption, CommissionProjectOption, CommissionRateOption, CommissionRow, CommissionStatus } from '@/components/commissions/commission-types'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'

export const dynamic = 'force-dynamic'

export default async function CommissionsPage() {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()
  const companyId = session.profile.company_id ?? session.user.id

  const [commissions, projects, rates, leads, agents] = await Promise.all([
    getCommissions(supabase, companyId),
    getProjects(supabase),
    getRates(supabase),
    getLeads(supabase, companyId),
    getAgents(supabase, companyId),
  ])

  return (
    <main className="px-3 py-4 sm:px-4 lg:px-6" dir="rtl">
      <CommissionsDashboard
        commissions={commissions}
        projects={projects}
        rates={rates}
        leads={leads}
        agents={agents}
      />
    </main>
  )
}

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>

async function getCommissions(supabase: ServerSupabase, companyId: string | null): Promise<CommissionRow[]> {
  let query = supabase
    .from('commissions')
    .select('id, deal_id, agent_id, company_id, amount, total_amount, gross_deal_value, gross_commission, agent_amount, company_amount, commission_rate, status, payment_method, payment_reference, payment_date, receipt_url, notes, created_at, paid_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (companyId) query = query.eq('company_id', companyId)
  const { data } = await query
  const rows = (data ?? []) as Array<Record<string, unknown>>
  const dealIds = Array.from(new Set(rows.map((row) => row.deal_id).filter(Boolean))) as string[]
  const agentIds = Array.from(new Set(rows.map((row) => row.agent_id).filter(Boolean))) as string[]
  const [deals, agents] = await Promise.all([getDealMap(supabase, dealIds), getAgentMap(supabase, agentIds)])

  return rows.map((row) => {
    const deal = typeof row.deal_id === 'string' ? deals.get(row.deal_id) : undefined
    const agent = typeof row.agent_id === 'string' ? agents.get(row.agent_id) : undefined
    const gross = Number(row.gross_commission ?? row.total_amount ?? row.amount ?? 0)
    const agentAmount = Number(row.agent_amount ?? row.amount ?? gross)
    return {
      id: String(row.id),
      dealId: typeof row.deal_id === 'string' ? row.deal_id : null,
      agentId: typeof row.agent_id === 'string' ? row.agent_id : null,
      agentName: agent ?? 'غير محدد',
      clientName: deal?.clientName ?? 'غير محدد',
      dealTitle: deal?.title ?? 'صفقة غير محددة',
      projectName: deal?.projectName ?? 'غير محدد',
      grossDealValue: Number(row.gross_deal_value ?? deal?.value ?? 0),
      commissionRate: Number(row.commission_rate ?? 0),
      grossCommission: gross,
      agentAmount,
      companyAmount: Number(row.company_amount ?? Math.max(gross - agentAmount, 0)),
      status: normalizeStatus(String(row.status ?? 'pending')),
      paymentMethod: typeof row.payment_method === 'string' ? row.payment_method : null,
      paymentReference: typeof row.payment_reference === 'string' ? row.payment_reference : null,
      paymentDate: typeof row.payment_date === 'string' ? row.payment_date : null,
      receiptUrl: typeof row.receipt_url === 'string' ? row.receipt_url : null,
      notes: typeof row.notes === 'string' ? row.notes : null,
      createdAt: String(row.created_at),
      paidAt: typeof row.paid_at === 'string' ? row.paid_at : null,
    }
  })
}

async function getDealMap(supabase: ServerSupabase, ids: string[]) {
  if (ids.length === 0) return new Map<string, { title: string; clientName: string; projectName: string; value: number }>()
  const { data } = await supabase
    .from('deals')
    .select('id, title, client_name, buyer_name, project_name, value, unit_value, amount, final_price')
    .in('id', ids)

  return new Map((data ?? []).map((deal) => [deal.id, {
    title: deal.title ?? deal.project_name ?? 'صفقة',
    clientName: deal.client_name ?? deal.buyer_name ?? 'عميل',
    projectName: deal.project_name ?? 'مشروع',
    value: Number(deal.final_price ?? deal.unit_value ?? deal.value ?? deal.amount ?? 0),
  }]))
}

async function getAgentMap(supabase: ServerSupabase, ids: string[]) {
  if (ids.length === 0) return new Map<string, string>()
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids)
  return new Map((data ?? []).map((profile) => [profile.id, profile.full_name ?? 'عضو فريق']))
}

async function getProjects(supabase: ServerSupabase): Promise<CommissionProjectOption[]> {
  const { data } = await supabase.from('projects').select('id, name, developer_id, developer_name').limit(500)
  return (data ?? []).map((project) => ({
    id: project.id,
    name: project.name,
    developerId: project.developer_id ?? null,
    developerName: project.developer_name ?? 'مطوّر',
  }))
}

async function getRates(supabase: ServerSupabase): Promise<CommissionRateOption[]> {
  const { data } = await supabase.from('commission_rates').select('*').limit(500)
  return ((data ?? []) as Array<Record<string, unknown>>).map((rate) => ({
    id: String(rate.id),
    developerId: typeof rate.developer_id === 'string' ? rate.developer_id : null,
    projectId: typeof rate.project_id === 'string' ? rate.project_id : null,
    minValue: Number(rate.min_value ?? 0),
    maxValue: rate.max_value === null || rate.max_value === undefined ? null : Number(rate.max_value),
    ratePercentage: Number(rate.rate_percentage ?? 0),
    agentSharePercentage: Number(rate.agent_share_percentage ?? 70),
    companySharePercentage: Number(rate.company_share_percentage ?? 30),
  }))
}

async function getLeads(supabase: ServerSupabase, companyId: string | null): Promise<CommissionLeadOption[]> {
  let query = supabase.from('leads').select('id, client_name, full_name, name, company_id').limit(500)
  if (companyId) query = query.eq('company_id', companyId)
  const { data } = await query
  return (data ?? []).map((lead) => ({ id: lead.id, name: lead.client_name ?? lead.full_name ?? lead.name ?? 'عميل' }))
}

async function getAgents(supabase: ServerSupabase, companyId: string | null) {
  let query = supabase.from('profiles').select('id, full_name, role, company_id').in('role', ['agent', 'broker', 'senior_agent', 'branch_manager']).limit(200)
  if (companyId) query = query.eq('company_id', companyId)
  const { data } = await query
  return (data ?? []).map((agent) => ({ id: agent.id, name: agent.full_name ?? 'عضو فريق' }))
}

function normalizeStatus(status: string): CommissionStatus {
  if (['pending', 'approved', 'processing', 'paid', 'disputed', 'cancelled'].includes(status)) return status as CommissionStatus
  return 'pending'
}
