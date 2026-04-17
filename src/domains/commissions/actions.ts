'use server'
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy finance workflow pending typed payout DTO migration. */

import { revalidatePath } from 'next/cache'
import { createServerClient, createRawClient, getCompanyId } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notify'
import type { Payout, PayoutItem, Commission } from '@/lib/types/db'

// ─── COMMISSIONS ─────────────────────────────────────────────────

export async function getCommissions(opts?: { agentId?: string; status?: string; page?: number }) {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()
  if (!companyId) return { commissions: [], total: 0 }

  const pageSize = 30
  const page = opts?.page ?? 1
  const from = (page - 1) * pageSize

  let q = supabase
    .from('commissions')
    .select('*, profiles!commissions_agent_id_fkey(full_name), deals(client_name, project_name)', { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (opts?.agentId) q = q.eq('agent_id', opts.agentId)
  if (opts?.status)  q = q.eq('status', opts.status)

  const { data, count } = await q
  return { commissions: (data ?? []) as Commission[], total: count ?? 0 }
}

export async function approveCommission(commissionId: string) {
  const supabase = await createServerClient()
  const raw = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: comm } = await raw.from('commissions').select('agent_id, amount').eq('id', commissionId).single()
  const { error } = await raw.from('commissions').update({ status: 'approved' }).eq('id', commissionId)
  if (error) throw new Error(error.message)

  if (comm?.agent_id) {
    void createNotification({
      user_id: comm.agent_id,
      title:   'تمت الموافقة على عمولتك',
      message: `مبلغ ${Number(comm.amount).toLocaleString()} ج.م — في انتظار الصرف`,
      type:    'success',
      link:    '/dashboard/commissions',
    })
  }
  revalidatePath('/dashboard/commissions')
  return { success: true }
}

// ─── PAYOUTS ─────────────────────────────────────────────────────

export async function getPayouts(opts?: { status?: string; page?: number }) {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()
  if (!companyId) return { payouts: [], total: 0 }

  const pageSize = 20
  const page = opts?.page ?? 1
  const from = (page - 1) * pageSize

  let q = supabase
    .from('payouts')
    .select('*, profiles!payouts_created_by_fkey(full_name)', { count: 'exact' })
    .or(`company_id.eq.${companyId}`)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (opts?.status) q = q.eq('status', opts.status)

  const { data, count } = await q
  return { payouts: (data ?? []) as Payout[], total: count ?? 0 }
}

export async function getPayoutDetail(payoutId: string) {
  const supabase = await createServerClient()
  const [{ data: payout }, { data: items }] = await Promise.all([
    supabase.from('payouts').select('*').eq('id', payoutId).single(),
    supabase
      .from('payout_items')
      .select('*, profiles!payout_items_agent_id_fkey(full_name), deals(client_name, project_name)')
      .eq('payout_id', payoutId)
      .order('created_at'),
  ])
  return { payout: payout as Payout | null, items: (items ?? []) as PayoutItem[] }
}

export async function createPayout(input: {
  title: string
  periodMonth: number
  periodYear: number
  commissionIds: string[]
}) {
  const supabase = await createServerClient()
  const raw = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const companyId = await getCompanyId()

  // Fetch commissions to build line items
  const { data: commissions } = await raw
    .from('commissions')
    .select('id, agent_id, amount, deal_id')
    .in('id', input.commissionIds)
    .eq('status', 'approved')

  if (!commissions?.length) return { success: false, error: 'لا توجد عمولات مُعتمدة لإنشاء صرف' }

  const totalAmount = (commissions as any[]).reduce((s: number, c: any) => s + Number(c.amount ?? 0), 0)

  const { data: payout, error: payoutError } = await raw.from('payouts').insert({
    company_id:   companyId,
    created_by:   user.id,
    title:        input.title,
    period_month: input.periodMonth,
    period_year:  input.periodYear,
    total_amount: totalAmount,
    status:       'pending_approval',
  }).select('id').single()

  if (payoutError || !payout) return { success: false, error: payoutError?.message }

  // Create line items
  await raw.from('payout_items').insert(
    (commissions as any[]).map((c: any) => ({
      payout_id:     (payout as any).id,
      commission_id: c.id,
      agent_id:      c.agent_id,
      deal_id:       c.deal_id,
      amount:        Number(c.amount ?? 0),
      tax_amount:    0,
      status:        'pending',
    }))
  )

  revalidatePath('/dashboard/commissions/payouts')
  return { success: true, payoutId: (payout as any).id }
}

export async function approvePayout(payoutId: string) {
  const supabase = await createServerClient()
  const raw = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await raw.from('payouts').update({
    status:      'approved',
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  }).eq('id', payoutId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/commissions/payouts')
  return { success: true }
}

export async function markPayoutPaid(payoutId: string) {
  const supabase = await createServerClient()
  const raw = await createRawClient()

  // Update payout + all items + all linked commissions
  const [, , { data: items }] = await Promise.all([
    raw.from('payouts').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payoutId),
    raw.from('payout_items').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('payout_id', payoutId),
    supabase.from('payout_items').select('commission_id, agent_id, amount').eq('payout_id', payoutId),
  ])

  // Mark commissions as paid and notify agents
  if (items?.length) {
    const commissionIds = items.map(i => i.commission_id).filter(Boolean) as string[]
    await raw.from('commissions').update({ status: 'paid', paid_at: new Date().toISOString() }).in('id', commissionIds)

    for (const item of items) {
      if (item.agent_id) {
        void createNotification({
          user_id: item.agent_id,
          title:   'تم صرف عمولتك 🎉',
          message: `تم إيداع ${Number(item.amount).toLocaleString()} ج.م في حسابك`,
          type:    'success',
          link:    '/dashboard/commissions',
        })
      }
    }
  }

  revalidatePath('/dashboard/commissions/payouts')
  return { success: true }
}

// ─── COMMISSION STATS ────────────────────────────────────────────

export async function getCommissionStats() {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()
  if (!companyId) return null

  const { data } = await supabase
    .from('commissions')
    .select('status, amount')
    .eq('company_id', companyId)

  const items = data ?? []
  return {
    pending:  items.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount ?? 0), 0),
    approved: items.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.amount ?? 0), 0),
    paid:     items.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount ?? 0), 0),
    total:    items.reduce((s, c) => s + Number(c.amount ?? 0), 0),
  }
}
