import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export async function POST(req: NextRequest) {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const {
    title,
    unit_type,
    area_sqm,
    rooms,
    bathrooms,
    finishing,
    is_furnished,
    features,
    pricing_strategy,
    total_cash_price,
    down_payment,
    installment_amount,
    area_location,
    project_name,
    developer_name,
    is_rented,
    rental_value,
    internal_area_sqm,
    external_area_sqm,
    special_notes,
  } = body

  const prompt = `أنت خبير تسويق عقاري محترف. اكتب محتوى تسويقياً احترافياً باللغة العربية لإعلان عقاري بناءً على المعلومات التالية:

العنوان: ${title ?? 'وحدة سكنية'}
النوع: ${unit_type ?? 'سكني'}
الموقع: ${area_location ?? 'غير محدد'}
المشروع: ${project_name ?? 'غير محدد'}
المطور: ${developer_name ?? 'غير محدد'}
المساحة الإجمالية: ${area_sqm ? area_sqm + ' م²' : 'غير محدد'}
${unit_type === 'تجاري' ? `المساحة الداخلية: ${internal_area_sqm ?? '-'} م²\nالمساحة الخارجية: ${external_area_sqm ?? '-'} م²` : ''}
عدد الغرف: ${rooms ?? 'غير محدد'}
عدد الحمامات: ${bathrooms ?? 'غير محدد'}
التشطيب: ${finishing ?? 'غير محدد'}
مفروشة: ${is_furnished ? 'نعم' : 'لا'}
المميزات: ${features === 'ROOF' ? 'روف' : features === 'GARDEN' ? 'جاردن' : 'لا يوجد'}
الحالة الإيجارية: ${is_rented ? `مؤجرة بقيمة ${rental_value ?? '-'} ج.م` : 'شاغرة'}
استراتيجية التسعير: ${pricing_strategy ?? 'غير محدد'}
السعر الإجمالي كاش: ${total_cash_price ? Number(total_cash_price).toLocaleString('ar-EG') + ' ج.م' : 'غير محدد'}
${down_payment ? `المقدم: ${Number(down_payment).toLocaleString('ar-EG')} ج.م` : ''}
${installment_amount ? `القسط: ${Number(installment_amount).toLocaleString('ar-EG')} ج.م` : ''}
ملاحظات خاصة: ${special_notes ?? 'لا يوجد'}

اكتب وصفاً تسويقياً جذاباً من 3 إلى 5 فقرات قصيرة يبرز مميزات الوحدة ويحفّز المشتري على التواصل. لا تستخدم هاشتاقات أو رموز تعبيرية. اجعل الأسلوب راقياً ومقنعاً.`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return NextResponse.json({ description: text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشل الاتصال بـ Gemini'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
