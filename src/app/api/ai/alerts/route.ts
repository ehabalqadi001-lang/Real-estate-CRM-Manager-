import { getCurrentSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { generateAlerts } from '@/lib/ai/generate-alerts'

export const runtime = 'nodejs'

export async function POST() {
  const session = await getCurrentSession()
  if (!session) return Response.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const supabase = await createServerSupabaseClient()
    const companyId = session.profile.company_id ?? session.user.id
    const now = Date.now()

    const [leadsResult, dealsResult, commissionsResult] = await Promise.all([
      supabase
        .from('leads')
        .select('id, name, client_name, full_name, updated_at, next_followup_date')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: true })
        .limit(20),
      supabase
        .from('deals')
        .select('id, title, stage, updated_at, created_at')
        .eq('company_id', companyId)
        .not('stage', 'in', '("closed","lost","closed_won","closed_lost")')
        .order('updated_at', { ascending: true })
        .limit(20),
      supabase
        .from('commissions')
        .select('id, amount, total_amount, gross_commission, created_at, status')
        .eq('company_id', companyId)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: true })
        .limit(20),
    ])

    if (leadsResult.error) throw new Error(leadsResult.error.message)
    if (dealsResult.error) throw new Error(dealsResult.error.message)
    if (commissionsResult.error) throw new Error(commissionsResult.error.message)

    const alerts = await generateAlerts({
      agentId: session.user.id,
      agentName: session.profile.full_name ?? 'الوكيل',
      staleLeads: (leadsResult.data ?? []).slice(0, 6).map((lead) => ({
        name: lead.name ?? lead.client_name ?? lead.full_name ?? 'عميل',
        days: daysSince(lead.updated_at ?? lead.next_followup_date, now),
        link: `/dashboard/leads/${lead.id}`,
      })),
      stuckDeals: (dealsResult.data ?? []).slice(0, 6).map((deal) => ({
        title: deal.title ?? 'صفقة',
        stage: deal.stage ?? 'غير محدد',
        days: daysSince(deal.updated_at ?? deal.created_at, now),
        link: `/dashboard/pipeline?deal=${deal.id}`,
      })),
      pendingCommissions: (commissionsResult.data ?? []).slice(0, 6).map((commission) => ({
        amount: Number(commission.gross_commission ?? commission.total_amount ?? commission.amount ?? 0),
        days: daysSince(commission.created_at, now),
        link: `/dashboard/commissions?commission=${commission.id}`,
      })),
      marketSignals: [],
    })

    await supabase.from('ai_alerts').insert(alerts.map((alert) => ({
      company_id: companyId,
      agent_id: session.user.id,
      priority: alert.priority,
      title: alert.title,
      body: alert.body,
      action_label: alert.action_label,
      action_link: alert.action_link,
      source_type: 'smart_alert',
      payload: alert,
    })))

    return Response.json({ alerts })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'تعذر إنشاء التنبيهات الذكية' }, { status: 500 })
  }
}

function daysSince(value: string | null | undefined, now: number) {
  if (!value) return 0
  return Math.max(0, Math.floor((now - new Date(value).getTime()) / 86400000))
}
