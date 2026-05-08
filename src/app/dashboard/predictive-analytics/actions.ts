'use server'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function generateForecastNarrativeAction(data: {
  totalDeals: number
  avgDealValue: number
  conversionRate: number
  topRegion: string
  monthlyTrend: string
}): Promise<{ narrative?: string; error?: string }> {
  await requirePermission('report.view.own')

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `أنت محلل مالي متخصص في سوق العقارات المصري. بناءً على البيانات التالية، اكتب تحليلاً تنبؤياً موجزاً باللغة العربية (3-4 جمل):

- إجمالي الصفقات: ${data.totalDeals}
- متوسط قيمة الصفقة: ${data.avgDealValue.toLocaleString('ar-EG')} ج.م
- معدل التحويل: ${data.conversionRate}%
- المنطقة الأعلى مبيعاً: ${data.topRegion || 'غير محدد'}
- الاتجاه الشهري: ${data.monthlyTrend}

اكتب توقعات للأشهر الثلاثة القادمة مع توصية استراتيجية واحدة. كن دقيقاً ومحدداً.`,
    }],
  })

  const narrative = message.content[0].type === 'text' ? message.content[0].text : ''
  return { narrative }
}
