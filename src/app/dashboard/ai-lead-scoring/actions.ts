'use server'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { getAIProvider, type AIModel } from '@/lib/ai-provider'
import { revalidatePath } from 'next/cache'

export interface LeadScoreResult {
  leadId: string
  temperature: 'hot' | 'warm' | 'cold'
  score: number
  reason: string
  nextAction: string
  urgency: 'high' | 'medium' | 'low'
}

export async function scoreLeadWithAIAction(
  leadId: string,
  model: AIModel = 'claude-sonnet-4-6'
): Promise<{ result?: LeadScoreResult; error?: string }> {
  await requirePermission('lead.view.own')
  const supabase = await createRawClient()

  const { data: lead } = await supabase
    .from('leads')
    .select('id, full_name, status, score, source, budget, notes, created_at, last_contact_at')
    .eq('id', leadId)
    .single()

  if (!lead) return { error: 'العميل المحتمل غير موجود' }

  const daysSinceContact = lead.last_contact_at
    ? Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / 86400000)
    : Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000)

  const provider = getAIProvider(model)

  const prompt = `أنت خبير تقييم عملاء محتملين في مجال العقارات المصري.

بيانات العميل:
- الاسم: ${lead.full_name ?? 'غير محدد'}
- الحالة: ${lead.status ?? 'جديد'}
- المصدر: ${lead.source ?? 'غير محدد'}
- الميزانية: ${lead.budget ? `${Number(lead.budget).toLocaleString('ar-EG')} ج.م` : 'غير محددة'}
- آخر تواصل: منذ ${daysSinceContact} يوم
- النقاط الحالية: ${lead.score ?? 0}/100
- ملاحظات: ${lead.notes ?? 'لا توجد'}

قيّم هذا العميل وأعد JSON فقط بهذا الشكل:
{
  "temperature": "hot|warm|cold",
  "score": <رقم 0-100>,
  "reason": "<سبب التقييم في جملة واحدة بالعربية>",
  "nextAction": "<الإجراء التالي الموصى به في جملة واحدة>",
  "urgency": "high|medium|low"
}

hot = جاهز للشراء خلال أسبوعين
warm = مهتم لكن يحتاج رعاية
cold = غير ناضج أو غير مهتم`

  const text = await provider.generate(prompt, { maxTokens: 300 })

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { error: 'فشل تحليل الرد' }
    const parsed = JSON.parse(jsonMatch[0]) as {
      temperature: 'hot' | 'warm' | 'cold'
      score: number
      reason: string
      nextAction: string
      urgency: 'high' | 'medium' | 'low'
    }

    // Update lead score in DB
    await supabase.from('leads').update({
      score:       parsed.score,
      temperature: parsed.temperature,
    }).eq('id', leadId)

    revalidatePath('/dashboard/ai-lead-scoring')
    revalidatePath('/dashboard/leads')

    return { result: { leadId, ...parsed } }
  } catch {
    return { error: 'فشل تحليل نتيجة الذكاء الاصطناعي' }
  }
}

export async function batchScoreLeadsAction(
  leadIds: string[],
  model: AIModel = 'claude-sonnet-4-6'
): Promise<{ results: LeadScoreResult[]; errors: number }> {
  await requirePermission('lead.view.own')

  const results: LeadScoreResult[] = []
  let errors = 0

  for (const id of leadIds.slice(0, 20)) {
    const res = await scoreLeadWithAIAction(id, model)
    if (res.result) results.push(res.result)
    else errors++
    await new Promise(r => setTimeout(r, 200))
  }

  return { results, errors }
}
