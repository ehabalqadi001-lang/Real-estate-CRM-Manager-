'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'
import { getAIProvider, type AIModel } from '@/lib/ai-provider'

export async function generateSkillContentAction(skillKey: string, context: string, model: AIModel) {
  await requirePermission('messages.read')

  if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    return { error: 'لم يتم إعداد مفتاح AI — أضف ANTHROPIC_API_KEY أو GEMINI_API_KEY في Vercel env vars' }
  }

  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
  const companyId = profile?.company_id ?? user.id

  const { data: skill } = await supabase
    .from('marketing_skills')
    .select('content, title_ar, title_en, department')
    .eq('skill_key', skillKey)
    .single()

  if (!skill) return { error: 'المهارة غير موجودة' }

  const prompt = `${skill.content}

---
السياق المحدد:
${context || 'وكالة عقارية مصرية متخصصة في البيع والتأجير'}

أنتج محتوى احترافي ومفصّلاً بناءً على التعليمات أعلاه والسياق المحدد.`

  let outputText: string
  try {
    const provider = getAIProvider(model)
    outputText = await provider.generate(prompt, { maxTokens: 1500 })
  } catch (err) {
    return { error: `فشل توليد المحتوى: ${err instanceof Error ? err.message : 'خطأ غير معروف'}` }
  }

  await supabase.from('creative_assets').insert({
    company_id: companyId,
    created_by: user.id,
    asset_type: skill.department.toLowerCase().replace(/\s+/g, '_'),
    prompt_used: context,
    output_text: outputText,
    provider: model.startsWith('gemini') ? 'gemini' : 'claude',
    status: 'completed',
    metadata: { skill_key: skillKey, skill_title: skill.title_ar ?? skill.title_en, model },
  })

  revalidatePath('/dashboard/marketing')
  revalidatePath('/dashboard/marketing/assets')
  return { success: true, output: outputText }
}
