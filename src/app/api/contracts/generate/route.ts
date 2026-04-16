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

  const dealId = req.nextUrl.searchParams.get('dealId')
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

  const { data: deal } = await supabase
    .from('deals')
    .select('*, developer:developers(name), agent:profiles(full_name, phone)')
    .eq('id', dealId)
    .single()

  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles').select('company_name, full_name, phone').eq('id', user.id).single()

  const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  const companyName = profile?.company_name ?? profile?.full_name ?? 'FAST INVESTMENT'
  const devName = typeof deal.developer === 'object' ? (deal.developer as { name?: string })?.name ?? 'المطور' : 'المطور'
  const agentName = typeof deal.agent === 'object' ? (deal.agent as { full_name?: string })?.full_name ?? 'الوكيل' : 'الوكيل'
  const agentPhone = typeof deal.agent === 'object' ? (deal.agent as { phone?: string })?.phone ?? '' : ''
  const unitValue = Number(deal.unit_value ?? 0)
  const amountPaid = Number(deal.amount_paid ?? 0)
  const remaining = unitValue - amountPaid

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>عقد بيع — ${deal.compound ?? 'وحدة عقارية'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', sans-serif; color: #0f172a; direction: rtl; font-size: 13px; line-height: 1.7; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 20px; margin-bottom: 28px; }
    .logo { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
    .logo-sub { font-size: 13px; color: #475569; margin-top: 4px; }
    .contract-title { font-size: 20px; font-weight: 900; text-align: center; margin: 20px 0; text-decoration: underline; text-underline-offset: 6px; }
    .preamble { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; font-size: 13px; color: #334155; }
    h2 { font-size: 15px; font-weight: 900; color: #0f172a; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #0f172a; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .info-item { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
    .info-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px; }
    .info-value { font-size: 14px; font-weight: 800; color: #0f172a; }
    .value-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .value-main { font-size: 28px; font-weight: 900; color: #15803d; }
    .value-label { font-size: 12px; color: #166534; margin-top: 4px; }
    .payment-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .payment-table th { background: #0f172a; color: #fff; padding: 10px 14px; text-align: right; font-size: 12px; }
    .payment-table td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .payment-table tr:last-child td { border-bottom: none; background: #f8fafc; font-weight: 800; }
    .clause { margin-bottom: 12px; padding-right: 16px; border-right: 3px solid #e2e8f0; }
    .clause-num { font-weight: 900; color: #0f172a; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 48px; }
    .sig-box { border-top: 2px solid #0f172a; padding-top: 10px; text-align: center; }
    .sig-label { font-size: 11px; font-weight: 700; color: #475569; }
    .sig-name { font-size: 13px; font-weight: 800; margin-top: 4px; }
    .sig-space { height: 60px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="logo">${companyName}</div>
    <div class="logo-sub">منظومة إدارة المبيعات العقارية المتكاملة</div>
  </div>

  <div class="contract-title">عقد بيع وحدة عقارية</div>

  <div class="preamble">
    تم إبرام هذا العقد بتاريخ <strong>${today}</strong> بين الأطراف المذكورة أدناه، وذلك وفقاً لأحكام القانون المدني المصري
    وقانون التطوير العقاري، وقد اتفق الأطراف على البنود والشروط التالية:
  </div>

  <h2>أولاً: بيانات الأطراف</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">الطرف الأول (شركة التسويق)</div>
      <div class="info-value">${companyName}</div>
    </div>
    <div class="info-item">
      <div class="info-label">الطرف الثاني (المشتري)</div>
      <div class="info-value">${deal.buyer_name ?? 'العميل'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">رقم هاتف المشتري</div>
      <div class="info-value">${deal.buyer_phone ?? '—'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">المطور العقاري</div>
      <div class="info-value">${devName}</div>
    </div>
    <div class="info-item">
      <div class="info-label">مسؤول المبيعات</div>
      <div class="info-value">${agentName}</div>
    </div>
    <div class="info-item">
      <div class="info-label">هاتف المسؤول</div>
      <div class="info-value">${agentPhone || '—'}</div>
    </div>
  </div>

  <h2>ثانياً: بيانات الوحدة العقارية</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">المشروع / الكومباوند</div>
      <div class="info-value">${deal.compound ?? '—'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">نوع الوحدة</div>
      <div class="info-value">${deal.property_type ?? '—'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">المحافظة</div>
      <div class="info-value">${deal.governorate ?? '—'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">مرحلة الصفقة</div>
      <div class="info-value">${deal.stage ?? '—'}</div>
    </div>
  </div>

  <h2>ثالثاً: القيمة المالية</h2>
  <div class="value-box">
    <div class="value-main">${new Intl.NumberFormat('ar-EG').format(unitValue)} ج.م</div>
    <div class="value-label">إجمالي قيمة الوحدة</div>
  </div>

  <table class="payment-table">
    <thead>
      <tr><th>البند</th><th>القيمة</th></tr>
    </thead>
    <tbody>
      <tr><td>إجمالي قيمة الوحدة</td><td>${new Intl.NumberFormat('ar-EG').format(unitValue)} ج.م</td></tr>
      <tr><td>المبلغ المدفوع</td><td>${new Intl.NumberFormat('ar-EG').format(amountPaid)} ج.م</td></tr>
      <tr><td>المتبقي للسداد</td><td>${new Intl.NumberFormat('ar-EG').format(remaining)} ج.م</td></tr>
    </tbody>
  </table>

  <h2>رابعاً: الشروط والأحكام</h2>

  <div class="clause">
    <span class="clause-num">١.</span> يلتزم الطرف الثاني (المشتري) بسداد كامل المبالغ المستحقة في مواعيدها المحددة، وفي حال التأخر يحق للطرف الأول تطبيق غرامات التأخير وفقاً لجدول الدفع المتفق عليه مع المطور.
  </div>
  <div class="clause">
    <span class="clause-num">٢.</span> تنتقل الملكية القانونية للوحدة للمشتري بعد سداد كامل ثمنها وإتمام إجراءات التسجيل الرسمي لدى مصلحة الشهر العقاري.
  </div>
  <div class="clause">
    <span class="clause-num">٣.</span> لا يحق للمشتري التنازل عن هذا العقد لطرف ثالث إلا بموافقة خطية مسبقة من شركة التسويق والمطور العقاري.
  </div>
  <div class="clause">
    <span class="clause-num">٤.</span> في حال الرغبة في الإلغاء، يتحمل المشتري رسوم الإلغاء المنصوص عليها في عقد التطوير العقاري الأصلي.
  </div>
  <div class="clause">
    <span class="clause-num">٥.</span> يُعتبر هذا العقد وثيقة ملزمة لكلا الطرفين بعد التوقيع عليه، ويُحتج به أمام جميع الجهات القانونية والإدارية.
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-label">الطرف الأول</div>
      <div class="sig-name">${companyName}</div>
    </div>
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-label">الطرف الثاني (المشتري)</div>
      <div class="sig-name">${deal.buyer_name ?? '—'}</div>
    </div>
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-label">شاهد</div>
      <div class="sig-name">_______________</div>
    </div>
  </div>

  <div class="footer">
    تم إصدار هذا العقد بواسطة منظومة ${companyName} CRM — ${today} — للاستخدام الرسمي فقط
  </div>
</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="contract-${dealId}.html"`,
    },
  })
}
