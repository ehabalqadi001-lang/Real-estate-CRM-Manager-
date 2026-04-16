import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get('month') // YYYY-MM  e.g. 2026-04
  const now = new Date()
  const [year, month] = monthParam
    ? [parseInt(monthParam.split('-')[0]), parseInt(monthParam.split('-')[1]) - 1]
    : [now.getFullYear(), now.getMonth()]

  const startDate = new Date(year, month, 1).toISOString()
  const endDate   = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
  const monthLabel = new Date(year, month, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })

  // Fetch data
  const [{ data: deals }, { data: leads }, { data: commissions }, { data: agents }] = await Promise.all([
    supabase.from('deals').select('title, unit_value, stage, created_at, agent_id')
      .eq('company_id', user.id).gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('leads').select('status, expected_value, created_at')
      .eq('company_id', user.id).gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('commissions').select('amount, status, commission_type')
      .eq('company_id', user.id).gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('profiles').select('full_name').eq('company_id', user.id).eq('role', 'agent'),
  ])

  const totalRevenue   = (deals ?? []).reduce((s, d) => s + Number(d.unit_value ?? 0), 0)
  const contractedDeals= (deals ?? []).filter(d => ['Contracted','Registration','Handover'].includes(d.stage ?? '')).length
  const totalLeads     = (leads ?? []).length
  const wonLeads       = (leads ?? []).filter(l => l.status === 'Won').length
  const convRate       = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0'
  const paidComm       = (commissions ?? []).filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount ?? 0), 0)
  const pendingComm    = (commissions ?? []).filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount ?? 0), 0)

  // Build HTML report (server-rendered, print-ready)
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>تقرير شهري — ${monthLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #0f172a; direction: rtl; padding: 40px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 28px; }
    .brand { font-size: 22px; font-weight: 900; color: #0f172a; }
    .brand-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .report-meta { text-align: left; font-size: 12px; color: #64748b; }
    .report-title { font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
    .kpi-value { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
    .kpi-label { font-size: 11px; color: #64748b; font-weight: 700; }
    .emerald { color: #059669; } .blue { color: #2563eb; } .purple { color: #7c3aed; }
    .amber { color: #d97706; } .rose { color: #e11d48; } .teal { color: #0d9488; }
    h2 { font-size: 15px; font-weight: 900; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #f1f5f9; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f8fafc; padding: 10px 12px; text-align: right; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-blue  { background: #dbeafe; color: #1e40af; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">FAST INVESTMENT</div>
      <div class="brand-sub">منظومة إدارة المبيعات العقارية</div>
    </div>
    <div class="report-meta">
      <div class="report-title">التقرير الشهري</div>
      <div>${monthLabel}</div>
      <div>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-value emerald">${(totalRevenue / 1_000_000).toFixed(2)}M ج.م</div>
      <div class="kpi-label">إجمالي الإيراد</div>
    </div>
    <div class="kpi">
      <div class="kpi-value blue">${contractedDeals}</div>
      <div class="kpi-label">صفقات مبرمة</div>
    </div>
    <div class="kpi">
      <div class="kpi-value purple">${totalLeads}</div>
      <div class="kpi-label">عملاء محتملون</div>
    </div>
    <div class="kpi">
      <div class="kpi-value teal">${convRate}%</div>
      <div class="kpi-label">معدل التحويل</div>
    </div>
    <div class="kpi">
      <div class="kpi-value emerald">${(paidComm / 1_000).toFixed(0)}K ج.م</div>
      <div class="kpi-label">عمولات مصروفة</div>
    </div>
    <div class="kpi">
      <div class="kpi-value amber">${(pendingComm / 1_000).toFixed(0)}K ج.م</div>
      <div class="kpi-label">عمولات معلقة</div>
    </div>
  </div>

  <h2>الصفقات هذا الشهر (${(deals ?? []).length} صفقة)</h2>
  <table>
    <thead>
      <tr><th>الصفقة</th><th>القيمة</th><th>المرحلة</th><th>التاريخ</th></tr>
    </thead>
    <tbody>
      ${(deals ?? []).slice(0, 20).map(d => `
        <tr>
          <td>${d.title ?? 'غير محدد'}</td>
          <td>${new Intl.NumberFormat('ar-EG').format(Number(d.unit_value ?? 0))} ج.م</td>
          <td><span class="badge badge-${['Contracted','Registration','Handover'].includes(d.stage ?? '') ? 'green' : 'amber'}">${d.stage ?? '—'}</span></td>
          <td>${new Date(d.created_at).toLocaleDateString('ar-EG')}</td>
        </tr>`).join('')}
      ${(deals ?? []).length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px">لا توجد صفقات هذا الشهر</td></tr>' : ''}
    </tbody>
  </table>

  <h2>فريق المبيعات (${(agents ?? []).length} وكيل)</h2>
  <table>
    <thead><tr><th>الوكيل</th></tr></thead>
    <tbody>
      ${(agents ?? []).map(a => `<tr><td>${a.full_name ?? 'وكيل'}</td></tr>`).join('')}
      ${(agents ?? []).length === 0 ? '<tr><td style="text-align:center;color:#94a3b8">لا يوجد وكلاء</td></tr>' : ''}
    </tbody>
  </table>

  <div class="footer">
    <span>FAST INVESTMENT CRM — تقرير سري للاستخدام الداخلي فقط</span>
    <span>صفحة 1 من 1</span>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="report-${year}-${String(month + 1).padStart(2, '0')}.html"`,
    },
  })
}
