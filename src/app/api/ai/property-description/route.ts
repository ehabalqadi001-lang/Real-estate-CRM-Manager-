import { streamText } from 'ai'
import { getCurrentSession } from '@/shared/auth/session'
import { getCrmOpenAiModel } from '@/lib/ai/openai'
import type { PropertyDescriptionInput } from '@/lib/ai/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) return Response.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const input = await request.json() as Partial<PropertyDescriptionInput>
    if (!input.projectName || !input.area || !input.price) {
      return Response.json({ error: 'بيانات الوحدة غير مكتملة' }, { status: 400 })
    }

    const result = await streamText({
      model: getCrmOpenAiModel(),
      system: 'أنت خبير تسويق عقاري في السوق المصري والعربي. اكتب وصفاً جذاباً للعقار باللغة العربية الفصحى المبسطة بدون مبالغة قانونية.',
      prompt: `وحدة في مشروع ${input.projectName}، ${input.area} م²، ${input.bedrooms ?? 0} غرف، بسعر ${input.price} ج.م، تشطيب ${input.finishing ?? 'غير محدد'}، النوع ${input.unitType ?? 'وحدة'}، المدينة ${input.city ?? 'غير محددة'}.
اكتب وصفاً تسويقياً مقنعاً في 3 فقرات قصيرة، مع إبراز القيمة الاستثمارية وسهولة المتابعة مع العميل.`,
      temperature: 0.55,
    })

    return result.toTextStreamResponse({
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'تعذر توليد الوصف' }, { status: 500 })
  }
}
