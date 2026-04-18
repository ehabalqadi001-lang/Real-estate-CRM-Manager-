import { NextRequest, NextResponse } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/erp/payroll/preview?month=4&year=2026
//
// Returns a preview payroll run for the requested period:
//   - All active employees with their base salary
//   - Pending approved commissions for the period (from commission_calculations)
//   - Attendance deductions (absent_days → daily_rate × absent)
//   - Rolled totals (gross, net, tax estimate)
//
// This preview does NOT write to the DB — call POST /api/erp/payroll/run to commit.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const month = parseInt(req.nextUrl.searchParams.get('month') ?? String(new Date().getMonth() + 1))
    const year  = parseInt(req.nextUrl.searchParams.get('year')  ?? String(new Date().getFullYear()))

    if (month < 1 || month > 12) return NextResponse.json({ error: 'Invalid month' }, { status: 400 })

    const supabase = await createRawClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 403 })

    // Only HR/Finance can preview payroll
    if (!['super_admin','hr_manager','finance_manager'].includes(profile.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Active employees with base salary
    const { data: employees } = await supabase
      .from('employees')
      .select(`
        id, employee_number, base_salary, pay_cycle, hire_date,
        profile:profiles!employees_id_fkey(full_name, role, email)
      `)
      .eq('company_id', profile.company_id)
      .is('termination_date', null)
      .order('employee_number')

    if (!employees?.length) {
      return NextResponse.json({ success: true, period: { month, year }, items: [], totals: zeroTotals() })
    }

    // 2. Pending commissions for this period
    const { data: commissions } = await supabase
      .from('commission_calculations')
      .select('employee_id, total_commission, deal_id')
      .eq('company_id', profile.company_id)
      .eq('period_month', month)
      .eq('period_year',  year)
      .in('status', ['approved','pending'])

    const commissionByEmployee = new Map<string, number>()
    for (const c of commissions ?? []) {
      commissionByEmployee.set(
        c.employee_id,
        (commissionByEmployee.get(c.employee_id) ?? 0) + Number(c.total_commission)
      )
    }

    // 3. Attendance for the period (absent days → deduction)
    const periodStart = `${year}-${String(month).padStart(2,'0')}-01`
    const periodEnd   = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: attendance } = await supabase
      .from('attendance_logs')
      .select('employee_id, status')
      .eq('company_id', profile.company_id)
      .gte('log_date', periodStart)
      .lte('log_date', periodEnd)

    const absentByEmployee = new Map<string, number>()
    const presentByEmployee = new Map<string, number>()
    for (const a of attendance ?? []) {
      if (a.status === 'absent') absentByEmployee.set(a.employee_id, (absentByEmployee.get(a.employee_id) ?? 0) + 1)
      else presentByEmployee.set(a.employee_id, (presentByEmployee.get(a.employee_id) ?? 0) + 1)
    }

    const WORK_DAYS_PER_MONTH = 22
    const TAX_RATE  = 0.10   // 10% income tax placeholder
    const INS_RATE  = 0.11   // 11% social insurance placeholder

    // 4. Build preview line items
    const items = (employees ?? []).map(emp => {
      const empProfile = Array.isArray(emp.profile) ? emp.profile[0] : emp.profile
      const baseSalary     = Number(emp.base_salary ?? 0)
      const commissionAmt  = commissionByEmployee.get(emp.id) ?? 0
      const absentDays     = absentByEmployee.get(emp.id) ?? 0
      const presentDays    = presentByEmployee.get(emp.id) ?? 0
      const dailyRate      = baseSalary / WORK_DAYS_PER_MONTH
      const absentDeduction = Math.round(dailyRate * absentDays * 100) / 100
      const grossSalary    = baseSalary + commissionAmt - absentDeduction
      const taxDeduction   = Math.round(grossSalary * TAX_RATE  * 100) / 100
      const insDeduction   = Math.round(grossSalary * INS_RATE  * 100) / 100
      const netSalary      = Math.round((grossSalary - taxDeduction - insDeduction) * 100) / 100

      return {
        employee_id:        emp.id,
        employee_number:    emp.employee_number,
        full_name:          empProfile?.full_name,
        role:               empProfile?.role,
        base_salary:        baseSalary,
        commission_amount:  commissionAmt,
        absent_deduction:   absentDeduction,
        gross_salary:       Math.round(grossSalary * 100) / 100,
        deduction_tax:      taxDeduction,
        deduction_insurance: insDeduction,
        net_salary:         netSalary,
        attendance_days:    presentDays,
        absent_days:        absentDays,
      }
    })

    const totals = {
      employee_count:    items.length,
      total_gross:       round2(items.reduce((s, i) => s + i.gross_salary, 0)),
      total_commission:  round2(items.reduce((s, i) => s + i.commission_amount, 0)),
      total_tax:         round2(items.reduce((s, i) => s + i.deduction_tax, 0)),
      total_insurance:   round2(items.reduce((s, i) => s + i.deduction_insurance, 0)),
      total_net:         round2(items.reduce((s, i) => s + i.net_salary, 0)),
    }

    return NextResponse.json({ success: true, period: { month, year }, items, totals })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

function round2(n: number) { return Math.round(n * 100) / 100 }
function zeroTotals() {
  return { employee_count: 0, total_gross: 0, total_commission: 0, total_tax: 0, total_insurance: 0, total_net: 0 }
}
