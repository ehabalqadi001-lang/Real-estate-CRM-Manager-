import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const client = new Anthropic()

const SYSTEM_PROMPT = `أنت مساعد مبيعات عقارية ذكي يعمل باسم شركة FAST INVESTMENT.
مهمتك:
1. الرد على استفسارات العملاء بشكل احترافي وودود باللغة العربية
2. جمع معلومات العميل (الاسم، الميزانية، نوع العقار المطلوب)
3. تقديم معلومات عامة عن العقارات المتاحة
4. تحديد مستوى الاهتمام وتصنيف العميل
5. تشجيع العميل على تحديد موعد مع أحد المسؤولين

قواعد مهمة:
- لا تعطِ أسعاراً محددة بدون استشارة الفريق
- إذا كان العميل جاداً، اطلب رقم هاتفه لإحالته للفريق
- كن موجزاً في ردودك (3-4 جمل كحد أقصى)
- لا تتحدث عن منافسين`

export async function POST(req: NextRequest) {
  try {
    const { message, phone, conversationHistory = [] } = await req.json() as {
      message: string
      phone: string
      conversationHistory: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!message || !phone) {
      return NextResponse.json({ error: 'message and phone are required' }, { status: 400 })
    }

    // إضافة الرسالة الجديدة للتاريخ
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    })

    const block = response.content[0]
    const reply = block.type === 'text' ? block.text : 'عذراً، حدث خطأ في المعالجة.'

    // حفظ المحادثة في قاعدة البيانات
    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() } } }
      )
      await supabase.from('whatsapp_ai_logs').insert({
        client_phone: phone,
        user_message: message,
        ai_reply: reply,
        model: 'claude-haiku-4-5-20251001',
      })
    } catch {
      // لا تعطل الرد إذا فشل الحفظ
    }

    return NextResponse.json({
      reply,
      updatedHistory: [...messages, { role: 'assistant', content: reply }]
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
