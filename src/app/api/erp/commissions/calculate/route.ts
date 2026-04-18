import { NextRequest, NextResponse } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/erp/commissions/calculate
//
// Two modes:
//   1. { dealId }              → resolves deal value + agent from DB, then calls SQL engine
//   2. { dealValue, role? }    → direct calculation (no DB round-trip for deal)
//
// Always delegates the waterfall maths to calculate_tiered_commission() in Postgres
// so the business logic lives in exactly one place.
// ─────────────────────────────────────────────────────────────────────────────

interface TierBreakdown {
  tier_name: string
  from_amount: number
  to_amount: number | null
  applicable_amount: number
  rate_pct: number
  bonus_flat: number
  tier_commission: number
}

interface CommissionResult {
  deal_value: number
  total_commission: number
  effective_rate: number
  breakdown: TierBreakdown[]
  employee_name?: string
  employee_role?: string
  deal_title?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dealId, dealValue, role, periodType = 'per_deal' } = body as {
      dealId?: string
      dealValue?: number
      role?: string
      periodType?: string
    }

    const supabase = await createRawClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve company_id from authenticated user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with this account' }, { status: 403 })
    }

    let resolvedValue: number = dealValue ?? 0
    let resolvedRole: string | undefined = role
    let dealMeta: { title?: string; employee_name?: string; employee_role?: string } = {}

    // Mode 1: resolve deal from DB
    if (dealId) {
      const { data: deal } = await supabase
        .from('deals')
        .select(`
          id, title, project_name, final_price, unit_value, value, amount, agent_id,
          agent:profiles!deals_agent_id_fkey(full_name, role)
        `)
        .eq('id', dealId)
        .eq('company_id', profile.company_id)
        .single()

      if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

      resolvedValue = (deal.final_price || deal.unit_value || deal.value || deal.amount) ?? 0
      const agent = Array.isArray(deal.agent) ? deal.agent[0] : deal.agent
      resolvedRole = agent?.role ?? resolvedRole
      dealMeta = {
        title: deal.title ?? deal.project_name,
        employee_name: agent?.full_name,
        employee_role: agent?.role,
      }
    }

    if (resolvedValue <= 0) {
      return NextResponse.json({ error: 'Deal value must be greater than 0' }, { status: 400 })
    }

    // Delegate waterfall calculation to the Postgres engine
    const { data, error } = await supabase.rpc('calculate_tiered_commission', {
      p_deal_value:  resolvedValue,
      p_company_id:  profile.company_id,
      p_role:        resolvedRole ?? null,
      p_period_type: periodType,
    })

    if (error) throw error

    const result: CommissionResult = {
      ...(data as CommissionResult),
      ...dealMeta,
    }

    return NextResponse.json({ success: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET ?dealId=xxx for quick browser test
export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get('dealId')
  if (!dealId) return NextResponse.json({ error: 'Pass ?dealId=' }, { status: 400 })
  return POST(new NextRequest(req.url, { method: 'POST', body: JSON.stringify({ dealId }) }))
}
