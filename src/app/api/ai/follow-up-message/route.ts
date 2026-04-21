import { streamText } from 'ai'
import { getCurrentSession } from '@/shared/auth/session'
import { getCrmOpenAiModel } from '@/lib/ai/openai'
import type { FollowUpMessageInput } from '@/lib/ai/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) return Response.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const input = await request.json() as Partial<FollowUpMessageInput>
    if (!input.clientName || !input.dealStage) {
      return Response.json({ error: 'بيانات الصفقة غير مكتملة' }, { status: 400 })
    }

    const result = await streamText({
      model: getCrmOpenAiModel(),
      system: 'أنت مستشار مبيعات عقارية. اكتب رسائل WhatsApp عربية قصيرة، مهذبة، مباشرة، وتدفع العميل لخطوة عملية واحدة.',
      prompt: `اكتب رسالة متابعة جاهزة للإرسال عبر واتساب.
اسم العميل: ${input.clientName}
مرحلة الصفقة: ${input.dealStage}
آخر تواصل: ${input.lastContactDate ?? 'غير محدد'}
اهتمام العميل: ${input.propertyInterest ?? 'غير محدد'}
اعتراضات أو ملاحظات: ${input.objections ?? 'لا توجد'}
المطلوب: رسالة واحدة لا تزيد عن 70 كلمة، بنبرة مهنية ودافئة، وتنتهي بسؤال واضح.`,
      temperature: 0.45,
    })

    return result.toTextStreamResponse({
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'تعذر توليد رسالة المتابعة' }, { status: 500 })
  }
}
