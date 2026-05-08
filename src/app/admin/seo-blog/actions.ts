'use server'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'

const BLOG_TYPES: Record<string, string> = {
  market_update:     'تحديث السوق العقاري',
  investment_guide:  'دليل الاستثمار العقاري',
  neighborhood:      'تقرير حي سكني',
  buying_guide:      'دليل المشتري',
  project_spotlight: 'تسليط الضوء على مشروع',
  seo_landing:       'صفحة هبوط SEO',
}

export async function generateBlogPostAction(formData: FormData) {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const blogType   = (formData.get('blog_type') as string) || 'market_update'
  const topic      = (formData.get('topic') as string)?.trim()
  const keywords   = (formData.get('keywords') as string)?.trim()
  const audience   = (formData.get('audience') as string) || 'مشترو العقارات في مصر'
  const wordCount  = parseInt(formData.get('word_count') as string) || 600
  const city       = (formData.get('city') as string)?.trim() || 'القاهرة'

  if (!topic) return { error: 'موضوع المقال مطلوب' }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `أنت كاتب محتوى SEO متخصص في سوق العقارات المصري. اكتب مقال مدونة احترافي كامل.

نوع المقال: ${BLOG_TYPES[blogType] ?? blogType}
الموضوع: ${topic}
الكلمات المفتاحية: ${keywords || 'عقارات مصر، استثمار عقاري، شراء شقة'}
الجمهور المستهدف: ${audience}
المدينة: ${city}
عدد الكلمات المستهدف: ${wordCount} كلمة تقريباً

يجب أن يحتوي المقال على:
1. عنوان رئيسي جذاب (H1) يحتوي الكلمة المفتاحية الرئيسية
2. مقدمة مشوقة (150 كلمة)
3. فقرات منظمة بعناوين فرعية (H2, H3)
4. إحصائيات وأرقام واقعية عن السوق المصري
5. نصائح عملية قابلة للتطبيق
6. خاتمة قوية مع دعوة للتصرف (CTA)
7. وصف meta SEO (160 حرف)

استخدم تنسيق HTML كامل مع tags صحيحة.
اكتب باللغة العربية الفصحى السهلة.`,
    }],
  })

  const contentHtml = message.content[0].type === 'text' ? message.content[0].text : ''

  const { data: inserted, error } = await supabase.from('creative_assets').insert({
    company_id:  companyId,
    created_by:  user.id,
    asset_type:  'blog_post',
    title:       topic,
    prompt_used: `${blogType} | ${keywords} | ${city}`,
    output_text: contentHtml,
    provider:    'claude-sonnet-4-6',
    metadata:    { blog_type: blogType, keywords, audience, city, word_count: wordCount },
    status:      'draft',
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath('/admin/seo-blog')
  return { success: true, id: inserted?.id, content: contentHtml }
}

export async function publishBlogPostAction(assetId: string) {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { error } = await supabase
    .from('creative_assets')
    .update({ status: 'published' })
    .eq('id', assetId)
  if (error) return { error: error.message }
  revalidatePath('/admin/seo-blog')
  return { success: true }
}

export async function deleteBlogPostAction(assetId: string) {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()
  const { error } = await supabase.from('creative_assets').delete().eq('id', assetId)
  if (error) return { error: error.message }
  revalidatePath('/admin/seo-blog')
  return { success: true }
}
