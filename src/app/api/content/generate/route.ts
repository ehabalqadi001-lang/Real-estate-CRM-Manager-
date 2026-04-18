import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createRawClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  // Auth guard — prevent unauthorized Gemini API consumption
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
  }

  try {
    const body = await req.json() as { property_details?: string; platforms?: string }
    const { property_details, platforms } = body

    if (!property_details || !platforms) {
      return NextResponse.json({ error: 'property_details and platforms are required' }, { status: 400 })
    }

    const prompt = `أنت خبير تسويق عقاري وقائد إداري في العاصمة الإدارية الجديدة بمصر.
    اكتب منشوراً تسويقياً احترافياً وجذاباً باللغة العربية للمنصات: ${platforms}.
    تفاصيل العقار: ${property_details}.
    ركز في صياغتك على العائد على الاستثمار، حفظ رأس المال، واستخدم هاشتاجات مناسبة.`

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({ content: text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json(
      { error: 'تعذر إنشاء المحتوى التسويقي حالياً.', detail: message },
      { status: 500 },
    )
  }
}
