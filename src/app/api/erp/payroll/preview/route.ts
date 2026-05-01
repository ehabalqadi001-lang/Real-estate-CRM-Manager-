import { NextRequest, NextResponse } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/erp/payroll/preview?month=4&year=2026
// Returns a print-ready HTML page for the payroll period (open in browser → Print → Save as PDF)
export async function GET(req: NextRequest) {
  try {
    const month = parseInt(req.nextUrl.searchParams.get('month') ?? String(new Date().getMonth() + 1))
    const year  = parseInt(req.nextUrl.searchParams.get('year')  ?? String(new Date().getFullYear()))

    if (month < 1 || month > 12) return NextResponse.json({ error: 'Invalid month' }, { status: 400 })

    const supabase = await createRawClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, tenant_id, role, full_name')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['super_admin', 'platform_admin', 'hr_manager', 'finance_manager']
    if (!allowedRoles.includes(profile?.role ?? '')) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const companyId = profile?.company_id ?? profile?.tenant_id

    let payrollQuery = supabase
      .from('payroll')
      .select(`
        id, employee_id, month, year,
        basic_salary, present_days, absent_days, late_count,
        total_commissions, deductions, gross_salary, net_salary, status,
        profiles!payroll_employee_id_fkey(full_name),
        employees!payroll_employee_id_fkey(job_title, department_id)
      `)
      .eq('month', month)
      .eq('year', year)
      .order('net_salary', { ascending: false })

    if (companyId) payrollQuery = payrollQuery.eq('company_id', companyId)

    const { data: payrollData, error } = await payrollQuery
    if (error) return new NextResponse(`DB Error: ${error.message}`, { status: 500 })

    type PayrollRow = {
      id: string; employee_id: string; month: number; year: number
      basic_salary: number; present_days: number; absent_days: number; late_count: number
      total_commissions: number; deductions: number; gross_salary: number; net_salary: number; status: string
      profiles: { full_name: string | null } | { full_name: string | null }[] | null
      employees: { job_title: string | null } | { job_title: string | null }[] | null
    }

    const payroll = ((payrollData ?? []) as unknown as PayrollRow[]).map((p) => ({
      ...p,
      profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
      employees: Array.isArray(p.employees) ? p.employees[0] : p.employees,
    }))

    const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)
    const periodLabel = new Date(year, month - 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })

    const totalNet    = payroll.reduce((s, p) => s + Number(p.net_salary ?? 0), 0)
    const totalGross  = payroll.reduce((s, p) => s + Number(p.gross_salary ?? 0), 0)
    const totalBasic  = payroll.reduce((s, p) => s + Number(p.basic_salary ?? 0), 0)
    const totalComm   = payroll.reduce((s, p) => s + Number(p.total_commissions ?? 0), 0)
    const totalDed    = payroll.reduce((s, p) => s + Number(p.deductions ?? 0), 0)

    const statusLabel: Record<string, string> = { draft: 'مسودة', approved: 'مُقرَّر', paid: 'مدفوع' }

    const rows = payroll.map((p, i) => `
      <tr class="${i % 2 === 0 ? 'even' : ''}">
        <td>${i + 1}</td>
        <td class="name">${p.profiles?.full_name ?? '—'}<br><small>${p.employees?.job_title ?? ''}</small></td>
        <td>${p.present_days ?? 0}</td>
        <td>${p.absent_days ?? 0} / ${p.late_count ?? 0}</td>
        <td class="num">${fmt(p.basic_salary)} ج.م</td>
        <td class="num green">${p.total_commissions > 0 ? fmt(p.total_commissions) + ' ج.م' : '—'}</td>
        <td class="num red">${p.deductions > 0 ? '(' + fmt(p.deductions) + ') ج.م' : '—'}</td>
        <td class="num">${fmt(p.gross_salary)} ج.م</td>
        <td class="num bold">${fmt(p.net_salary)} ج.م</td>
        <td><span class="badge badge-${p.status}">${statusLabel[p.status] ?? p.status}</span></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>مسيرة رواتب — ${periodLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    font-size: 12px;
    color: #1a1a2e;
    background: #fff;
    padding: 24px;
    direction: rtl;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #059669;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  .company { font-size: 20px; font-weight: 900; color: #059669; }
  .period  { font-size: 13px; color: #64748b; margin-top: 4px; }
  .generated { font-size: 10px; color: #94a3b8; text-align: left; }
  .kpis {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  .kpi {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    text-align: center;
  }
  .kpi-label { font-size: 10px; color: #64748b; font-weight: 700; }
  .kpi-value { font-size: 15px; font-weight: 900; color: #1a1a2e; margin-top: 3px; }
  .kpi-value.green { color: #059669; }
  .kpi-value.red   { color: #dc2626; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  thead tr {
    background: #059669;
    color: #fff;
  }
  thead th {
    padding: 8px 10px;
    text-align: right;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }
  tbody tr:hover { background: #f0fdf4; }
  tbody tr.even  { background: #fafafa; }
  tbody td {
    padding: 7px 10px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  td.name small { color: #94a3b8; font-size: 10px; display: block; }
  td.num  { text-align: left; font-weight: 700; font-size: 11px; }
  td.num.green  { color: #059669; }
  td.num.red    { color: #dc2626; }
  td.num.bold   { font-size: 13px; font-weight: 900; }
  tfoot tr {
    background: #f0fdf4;
    border-top: 2px solid #059669;
  }
  tfoot td {
    padding: 8px 10px;
    font-weight: 900;
    font-size: 12px;
  }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
  }
  .badge-draft    { background: #fef3c7; color: #92400e; }
  .badge-approved { background: #d1fae5; color: #065f46; }
  .badge-paid     { background: #dbeafe; color: #1e40af; }
  .footer {
    margin-top: 32px;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
    font-size: 10px;
    color: #94a3b8;
  }
  .sig-box {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 20px;
    min-width: 140px;
    text-align: center;
  }
  .sig-line { border-top: 1px solid #64748b; margin-top: 24px; padding-top: 4px; font-size: 10px; color: #64748b; }
  @media print {
    body { padding: 0; }
    @page { size: A4 landscape; margin: 15mm; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="company">FAST INVESTMENT — مسيرة الرواتب</div>
    <div class="period">الفترة: ${periodLabel} &nbsp;|&nbsp; عدد الموظفين: ${payroll.length}</div>
  </div>
  <div class="generated">
    تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
    أُعدَّ بواسطة: ${profile?.full_name ?? 'النظام'}
  </div>
</div>

<div class="kpis">
  <div class="kpi">
    <div class="kpi-label">إجمالي الرواتب الأساسية</div>
    <div class="kpi-value">${fmt(totalBasic)} ج.م</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">إجمالي العمولات</div>
    <div class="kpi-value green">${fmt(totalComm)} ج.م</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">إجمالي الاستقطاعات</div>
    <div class="kpi-value red">(${fmt(totalDed)}) ج.م</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">إجمالي الإجمالي</div>
    <div class="kpi-value">${fmt(totalGross)} ج.م</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">صافي الرواتب الكلي</div>
    <div class="kpi-value green">${fmt(totalNet)} ج.م</div>
  </div>
</div>

${payroll.length === 0 ? '<p style="text-align:center;padding:40px;color:#94a3b8;font-weight:700;">لا توجد بيانات مسيرة لهذه الفترة.</p>' : `
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>الموظف</th>
      <th>أيام حضور</th>
      <th>غياب / تأخير</th>
      <th>الراتب الأساسي</th>
      <th>عمولات</th>
      <th>استقطاعات</th>
      <th>الإجمالي</th>
      <th>الصافي</th>
      <th>الحالة</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="4">الإجماليات — ${payroll.length} موظف</td>
      <td class="num">${fmt(totalBasic)} ج.م</td>
      <td class="num green">${fmt(totalComm)} ج.م</td>
      <td class="num red">(${fmt(totalDed)}) ج.م</td>
      <td class="num">${fmt(totalGross)} ج.م</td>
      <td class="num bold green">${fmt(totalNet)} ج.م</td>
      <td></td>
    </tr>
  </tfoot>
</table>
`}

<div class="footer">
  <div>
    <div class="sig-box">
      <div class="sig-line">مدير الموارد البشرية</div>
    </div>
  </div>
  <div style="text-align:center;color:#94a3b8;font-size:10px;align-self:flex-end">
    FAST INVESTMENT Enterprise OS — مسيرة رواتب ${periodLabel}
  </div>
  <div>
    <div class="sig-box">
      <div class="sig-line">المدير المالي</div>
    </div>
  </div>
</div>

<script>window.onload = () => window.print()</script>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err) {
    return new NextResponse(err instanceof Error ? err.message : 'Internal error', { status: 500 })
  }
}
