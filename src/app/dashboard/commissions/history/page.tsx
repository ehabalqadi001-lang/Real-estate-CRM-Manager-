import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { CommissionsHistoryClient } from '@/components/commissions/CommissionsHistoryClient'
import type { CommissionRow, CommissionStatus } from '@/components/commissions/commission-types'

export const dynamic = 'force-dynamic'

export default async function CommissionHistoryPage() {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()
  const companyId = session.profile.company_id ?? session.user.id
  let query = supabase
    .from('commissions')
    .select('id, deal_id, agent_id, company_id, amount, total_amount, gross_deal_value, gross_commission, agent_amount, company_amount, commission_rate, status, payment_method, payment_reference, payment_date, receipt_url, notes, created_at, paid_at')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(1000)

  if (companyId) query = query.eq('company_id', companyId)
  const { data } = await query
  const rows = (data ?? []) as Array<Record<string, unknown>>
  const agentIds = Array.from(new Set(rows.map((row) => row.agent_id).filter(Boolean))) as string[]
  const { data: agentRows } = agentIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', agentIds)
    : { data: [] }
  const agentMap = new Map((agentRows ?? []).map((agent) => [agent.id, agent.full_name ?? 'عضو فريق']))

  const commissions: CommissionRow[] = rows.map((row) => {
    const gross = Number(row.gross_commission ?? row.total_amount ?? row.amount ?? 0)
    const agentAmount = Number(row.agent_amount ?? row.amount ?? gross)
    return {
      id: String(row.id),
      dealId: typeof row.deal_id === 'string' ? row.deal_id : null,
      agentId: typeof row.agent_id === 'string' ? row.agent_id : null,
      agentName: typeof row.agent_id === 'string' ? agentMap.get(row.agent_id) ?? 'عضو فريق' : 'عضو فريق',
      clientName: 'عميل',
      dealTitle: 'صفقة',
      projectName: 'مشروع',
      grossDealValue: Number(row.gross_deal_value ?? 0),
      commissionRate: Number(row.commission_rate ?? 0),
      grossCommission: gross,
      agentAmount,
      companyAmount: Number(row.company_amount ?? Math.max(gross - agentAmount, 0)),
      status: String(row.status ?? 'paid') as CommissionStatus,
      paymentMethod: typeof row.payment_method === 'string' ? row.payment_method : null,
      paymentReference: typeof row.payment_reference === 'string' ? row.payment_reference : null,
      paymentDate: typeof row.payment_date === 'string' ? row.payment_date : null,
      receiptUrl: typeof row.receipt_url === 'string' ? row.receipt_url : null,
      notes: typeof row.notes === 'string' ? row.notes : null,
      createdAt: String(row.created_at),
      paidAt: typeof row.paid_at === 'string' ? row.paid_at : null,
    }
  })

  return (
    <main className="px-3 py-4 sm:px-4 lg:px-6" dir="rtl">
      <CommissionsHistoryClient commissions={commissions} />
    </main>
  )
}
