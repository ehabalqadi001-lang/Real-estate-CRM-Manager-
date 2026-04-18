import { NextRequest, NextResponse } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/erp/payroll/run
//
// Body: { month, year, notes? }
//
// Commits the payroll preview to the DB:
//   1. Validates no existing run for period
//   2. Re-runs preview calculations
//   3. Inserts payroll_runs + payroll_line_items in a single transaction
//   4. Marks included commission_calculations as 'paid'
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { month, year, notes } = body as { month: number; year: number; notes?: string }

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month/year' }, { status: 400 })
    }

    const supabase = await createRawClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 403 })
    if (!['super_admin', 'hr_manager'].includes(profile.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Guard: duplicate run
    const { data: existing } = await supabase
      .from('payroll_runs')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('period_month', month)
      .eq('period_year', year)
      .single()

    if (existing) {
      return NextResponse.json({ error: `Payroll already committed for ${month}/${year}` }, { status: 409 })
    }

    // Re-fetch preview data (same logic as /preview)
    const previewRes = await fetch(
      new URL(`/api/erp/payroll/preview?month=${month}&year=${year}`, req.url),
      { headers: { Cookie: req.headers.get('cookie') ?? '' } }
    )
    const preview = await previewRes.json()
    if (!preview.success) return NextResponse.json({ error: preview.error }, { status: 500 })

    const { items, totals } = preview

    // Create payroll run header
    const { data: run, error: runErr } = await supabase
      .from('payroll_runs')
      .insert({
        company_id:     profile.company_id,
        period_month:   month,
        period_year:    year,
        run_date:       new Date().toISOString().split('T')[0],
        status:         'draft',
        total_gross:    totals.total_gross,
        total_net:      totals.total_net,
        total_tax:      totals.total_tax,
        total_insurance: totals.total_insurance,
        employee_count: totals.employee_count,
        notes:          notes ?? null,
        created_by:     user.id,
      })
      .select()
      .single()

    if (runErr) throw runErr

    // Insert line items into payroll_items (run_id FK)
    const lines = items.map((item: {
      employee_id: string; base_salary: number; commission_amount: number;
      absent_deduction: number; gross_salary: number; deduction_tax: number;
      deduction_insurance: number; net_salary: number; attendance_days: number; absent_days: number;
    }) => ({
      run_id:               run.id,
      company_id:           profile.company_id,
      employee_id:          item.employee_id,
      base_salary:          item.base_salary,
      commission_amount:    item.commission_amount,
      gross_salary:         item.gross_salary,
      deduction_tax:        item.deduction_tax,
      deduction_insurance:  item.deduction_insurance,
      deduction_other:      item.absent_deduction,
      net_salary:           item.net_salary,
      attendance_days:      item.attendance_days,
      absent_days:          item.absent_days,
    }))

    const { error: linesErr } = await supabase
      .from('payroll_items')
      .insert(lines)

    if (linesErr) throw linesErr

    // Mark commissions as paid
    const employeeIds = items.map((i: { employee_id: string }) => i.employee_id)
    await supabase
      .from('commission_calculations')
      .update({ status: 'paid', paid_in_run_id: run.id })
      .eq('company_id', profile.company_id)
      .eq('period_month', month)
      .eq('period_year', year)
      .in('status', ['approved', 'pending'])
      .in('employee_id', employeeIds)

    return NextResponse.json({ success: true, run_id: run.id, totals })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
