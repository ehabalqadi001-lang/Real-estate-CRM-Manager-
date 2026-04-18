import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// تهيئة Gemini باستخدام المفتاح السري
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    // استقبال بيانات العقار من التطبيق
    const body = await req.json();
    const { property_details, platforms } = body;

    // صياغة الطلب للذكاء الاصطناعي
    const prompt = `أنت خبير تسويق عقاري وقائد إداري في العاصمة الإدارية الجديدة بمصر. 
    اكتب منشوراً تسويقياً احترافياً وجذاباً باللغة العربية للمنصات: ${platforms}.
    تفاصيل العقار: ${property_details}.
    ركز في صياغتك على العائد على الاستثمار، حفظ رأس المال، واستخدم هاشتاجات مناسبة.`;

    // اختيار الموديل (استخدمنا النسخة السريعة والمجانية Flash)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    });
    
    // توليد المحتوى
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ content: text });

  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'تعذر إنشاء المحتوى التسويقي حالياً.' },
      { status: 500 }
    );
  }
}
