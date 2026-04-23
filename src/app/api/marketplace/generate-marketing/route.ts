import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      description: buildFallbackDescription(await req.json()),
      warning: 'Gemini غير مضبوط على الخادم، تم إنشاء وصف احتياطي.',
    })
  }

  const body = await req.json()
  const prompt = buildPrompt(body)

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    })
    const result = await model.generateContent(prompt)
    const description = result.response.text().trim()
    return NextResponse.json({ description })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشل الاتصال بخدمة Gemini'
    return NextResponse.json({
      description: buildFallbackDescription(body),
      warning: isQuotaError(message)
        ? 'تم تجاوز حد استخدام Gemini مؤقتًا، تم إنشاء وصف احتياطي قابل للتعديل.'
        : 'تعذر الاتصال بـ Gemini، تم إنشاء وصف احتياطي قابل للتعديل.',
      detail: message,
    })
  }
}

function isQuotaError(message: string) {
  const lower = message.toLowerCase()
  return lower.includes('429') || lower.includes('quota') || lower.includes('rate limit') || lower.includes('too many requests')
}

function buildFallbackDescription(data: Record<string, unknown>) {
  const title = text(data.title, 'وحدة عقارية مميزة')
  const unitType = text(data.unit_type, 'وحدة')
  const location = text(data.area_location, 'موقع مميز')
  const project = text(data.project_name, 'مشروع مميز')
  const developer = text(data.developer_name, 'مطور موثوق')
  const area = text(data.area_sqm, 'مساحة مناسبة')
  const rooms = text(data.rooms, '')
  const bathrooms = text(data.bathrooms, '')
  const finishing = text(data.finishing, 'تشطيب مناسب')
  const notes = text(data.special_notes, '')
  const price = formatMoney(data.total_cash_price)
  const downPayment = formatMoney(data.down_payment)
  const installment = formatMoney(data.installment_amount)

  const layout = [
    `تقدم FAST INVESTMENT فرصة مميزة لامتلاك ${unitType} بعنوان "${title}" في ${location} داخل ${project} مع ${developer}.`,
    `تبلغ المساحة الإجمالية ${area} م²${rooms ? `، وتضم ${rooms} غرف` : ''}${bathrooms ? ` و${bathrooms} حمامات` : ''}، مع ${finishing} وتوزيع عملي يناسب السكن أو الاستثمار حسب طبيعة الوحدة.`,
    `السعر الكاش ${price}${downPayment !== 'غير محدد' ? `، والمقدم ${downPayment}` : ''}${installment !== 'غير محدد' ? `، والقسط ${installment}` : ''}.`,
    notes && notes !== 'لا يوجد' ? `تفاصيل إضافية: ${notes}.` : '',
    'للمهتمين بالشراء أو المقارنة الاستثمارية، يمكن مراجعة بيانات الوحدة وتحديد أنسب طريقة للتعاقد وفقًا للمستندات المتاحة.',
  ].filter(Boolean)

  return layout.join('\n\n')
}

function buildPrompt(data: Record<string, unknown>) {
  const unitType = text(data.unit_type, 'سكني')
  const isCommercial = unitType === 'تجاري'
  const isRented = Boolean(data.is_rented)
  const isFurnished = Boolean(data.is_furnished)
  const features = text(data.features, 'NONE')

  return `
أنت خبير تسويق عقاري في السوق المصري وتكتب لصالح FAST INVESTMENT.
اكتب وصفا تسويقيا احترافيا باللغة العربية الفصحى السهلة لإعلان وحدة عقارية.

قواعد الكتابة:
- 3 إلى 5 فقرات قصيرة.
- لا تستخدم هاشتاجات أو رموز تعبيرية.
- لا تذكر رقم هاتف.
- لا تخترع معلومات غير موجودة.
- اجعل النبرة راقية وواضحة ومقنعة.

بيانات الوحدة:
العنوان: ${text(data.title, 'وحدة عقارية مميزة')}
نوع الوحدة: ${unitType}
الموقع: ${text(data.area_location, 'غير محدد')}
المشروع: ${text(data.project_name, 'غير محدد')}
المطور: ${text(data.developer_name, 'غير محدد')}
المساحة الإجمالية: ${text(data.area_sqm, 'غير محدد')} م²
${isCommercial ? `المساحة الداخلية: ${text(data.internal_area_sqm, 'غير محدد')} م²
المساحة الخارجية: ${text(data.external_area_sqm, 'غير محدد')} م²` : ''}
عدد الغرف: ${text(data.rooms, 'غير محدد')}
عدد الحمامات: ${text(data.bathrooms, 'غير محدد')}
التشطيب: ${text(data.finishing, 'غير محدد')}
مفروشة: ${isFurnished ? 'نعم' : 'لا'}
المميزات: ${features === 'ROOF' ? 'روف' : features === 'GARDEN' ? 'جاردن' : 'لا يوجد'}
الحالة الإيجارية: ${isRented ? `مؤجرة بقيمة ${text(data.rental_value, 'غير محدد')} ج.م` : 'شاغرة'}
طريقة البيع: ${text(data.pricing_strategy, 'غير محدد')}
السعر الكاش: ${formatMoney(data.total_cash_price)}
المقدم: ${formatMoney(data.down_payment)}
القسط: ${formatMoney(data.installment_amount)}
تفاصيل مميزة: ${text(data.special_notes, 'لا يوجد')}
`.trim()
}

function text(value: unknown, fallback: string) {
  if (value == null) return fallback
  const stringValue = String(value).trim()
  return stringValue || fallback
}

function formatMoney(value: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return 'غير محدد'
  return `${amount.toLocaleString('ar-EG')} ج.م`
}
