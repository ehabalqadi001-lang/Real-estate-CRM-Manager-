'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, getCompanyId } from '@/lib/supabase/server'
import type { Expense } from '@/lib/types/db'

// ─── EXPENSES ────────────────────────────────────────────────────

export async function getExpenses(opts?: { category?: string; status?: string; page?: number }) {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()
  if (!companyId) return { expenses: [], total: 0 }

  const pageSize = 30
  const page = opts?.page ?? 1
  const from = (page - 1) * pageSize

  let q = supabase
    .from('expenses')
    .select('*, profiles!expenses_created_by_fkey(full_name)', { count: 'exact' })
    .eq('company_id', companyId)
    .order('expense_date', { ascending: false })
    .range(from, from + pageSize - 1)

  if (opts?.category) q = q.eq('category', opts.category)
  if (opts?.status)   q = q.eq('status', opts.status)

  const { data, count } = await q
  return { expenses: (data ?? []) as Expense[], total: count ?? 0 }
}

export async function createExpense(input: {
  category: Expense['category']
  description: string
  amount: number
  expenseDate: string
  receiptUrl?: string
  notes?: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const companyId = await getCompanyId()

  const { error } = await supabase.from('expenses').insert({
    company_id:   companyId,
    created_by:   user.id,
    category:     input.category,
    description:  input.description,
    amount:       input.amount,
    expense_date: input.expenseDate,
    receipt_url:  input.receiptUrl ?? null,
    notes:        input.notes ?? null,
    status:       'pending',
  })
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/finance/expenses')
  revalidatePath('/dashboard/finance')
  return { success: true }
}

export async function approveExpense(expenseId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('expenses').update({
    status:      'approved',
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  }).eq('id', expenseId)

  revalidatePath('/dashboard/finance/expenses')
  return { success: true }
}

// ─── FINANCE SUMMARY ─────────────────────────────────────────────

export async function getFinanceSummary(year: number, month?: number) {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()
  if (!companyId) return null

  const startDate = month
    ? `${year}-${String(month).padStart(2, '0')}-01`
    : `${year}-01-01`
  const endDate = month
    ? new Date(year, month, 0).toISOString().split('T')[0]
    : `${year}-12-31`

  const [{ data: deals }, { data: commissions }, { data: expenses }] = await Promise.all([
    supabase
      .from('deals')
      .select('final_price, unit_value, amount, value, stage, created_at')
      .eq('company_id', companyId)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabase
      .from('commissions')
      .select('amount, status')
      .eq('company_id', companyId)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabase
      .from('expenses')
      .select('amount, category, status')
      .eq('company_id', companyId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .eq('status', 'approved'),
  ])

  const totalRevenue = (deals ?? []).reduce((s, d) => {
    const v = Number(d.final_price ?? d.unit_value ?? d.amount ?? d.value ?? 0)
    return s + v
  }, 0)

  const totalCommissions = (commissions ?? [])
    .filter(c => c.status === 'paid')
    .reduce((s, c) => s + Number(c.amount ?? 0), 0)

  const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount ?? 0), 0)

  const expensesByCategory = (expenses ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount ?? 0)
    return acc
  }, {})

  return {
    totalRevenue,
    totalCommissions,
    totalExpenses,
    netProfit:    totalRevenue - totalCommissions - totalExpenses,
    deals:        deals?.length ?? 0,
    expensesByCategory,
  }
}

// ─── REVENUE TREND ───────────────────────────────────────────────

export async function getRevenueTrend(months = 12) {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()
  if (!companyId) return []

  const start = new Date()
  start.setMonth(start.getMonth() - months + 1)
  start.setDate(1)

  const { data: deals } = await supabase
    .from('deals')
    .select('final_price, unit_value, amount, value, created_at')
    .eq('company_id', companyId)
    .gte('created_at', start.toISOString())
    .order('created_at')

  const monthMap = new Map<string, number>()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap.set(key, 0)
  }

  for (const deal of deals ?? []) {
    const d = new Date(deal.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const val = Number(deal.final_price ?? deal.unit_value ?? deal.amount ?? deal.value ?? 0)
    if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + val)
  }

  return Array.from(monthMap.entries()).map(([month, revenue]) => ({ month, revenue }))
}
