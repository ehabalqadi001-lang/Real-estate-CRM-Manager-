import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createRawClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // Auth guard — prevent unauthorized Gemini API consumption
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as { property_details?: string; platforms?: string }
    const { property_details, platforms } = body

    if (!property_details || !platforms) {
      return NextResponse.json({ error: 'property_details and platforms are required' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        content: buildFallbackContent(property_details, platforms),
        warning: 'Gemini غير مضبوط على الخادم، تم إنشاء محتوى احتياطي.',
      })
    }

    const prompt = `أنت خبير تسويق عقاري وقائد إداري في العاصمة الإدارية الجديدة بمصر.
    اكتب منشوراً تسويقياً احترافياً وجذاباً باللغة العربية للمنصات: ${platforms}.
    تفاصيل العقار: ${property_details}.
    ركز في صياغتك على العائد على الاستثمار، حفظ رأس المال، واستخدم هاشتاجات مناسبة.`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({ content: text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({
      content: buildFallbackContent('تفاصيل العقار غير متاحة بالكامل', 'Facebook, Instagram'),
      warning: isQuotaError(message)
        ? 'تم تجاوز حد استخدام Gemini مؤقتًا، تم إنشاء محتوى احتياطي.'
        : 'تعذر الاتصال بـ Gemini، تم إنشاء محتوى احتياطي.',
      detail: message,
    })
  }
}

function isQuotaError(message: string) {
  const lower = message.toLowerCase()
  return lower.includes('429') || lower.includes('quota') || lower.includes('rate limit') || lower.includes('too many requests')
}

function buildFallbackContent(propertyDetails: string, platforms: string) {
  return [
    `فرصة عقارية مميزة من FAST INVESTMENT مناسبة للنشر على ${platforms}.`,
    `تفاصيل العقار: ${propertyDetails}.`,
    'الوحدة مناسبة للباحثين عن اختيار واضح يجمع بين الموقع الجيد، سهولة المقارنة، وإمكانية اتخاذ قرار شراء أو استثمار بناءً على بيانات فعلية.',
    'للحصول على أفضل نتيجة، راجع السعر والمساحة والموقع والمستندات قبل النشر النهائي.',
  ].join('\n\n')
}
