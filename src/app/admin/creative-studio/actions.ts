'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'
import { decrypt } from '@/lib/crypto'
import { getAIProvider, type AIModel } from '@/lib/ai-provider'

async function getCompanyKey(companyId: string, keyName: string): Promise<string | null> {
  const supabase = await createRawClient()
  const { data } = await supabase
    .from('company_api_keys')
    .select('encrypted_value')
    .eq('company_id', companyId)
    .eq('key_name', keyName)
    .single()
  if (!data?.encrypted_value) return null
  try { return decrypt(data.encrypted_value) } catch { return null }
}

// ── Ad Copy / Social Post / Email via Claude ──────────────────
export async function generateCopyAction(formData: FormData) {
  await requirePermission('messages.create')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase.from('user_profiles').select('company_id, full_name').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const assetType   = formData.get('asset_type') as string
  const propertyRef = formData.get('property_ref') as string
  const audience    = formData.get('audience') as string
  const tone        = formData.get('tone') as string
  const skillKey    = formData.get('skill_key') as string
  const model       = (formData.get('model') as AIModel) || 'claude-sonnet-4-6'

  if (!assetType || !propertyRef) return { error: 'نوع المحتوى والمرجع مطلوبان' }

  const SKILL_PROMPTS: Record<string, string> = {
    ad_copy:     'You are an expert real estate ad copywriter for the Egyptian market. Write compelling Meta/Google ad copy.',
    social_post: 'You are a social media specialist for Egyptian real estate. Write engaging posts for Facebook & Instagram.',
    email:       'You are an email marketing expert for real estate. Write a persuasive outreach email.',
    script:      'You are a video script writer for real estate tours. Write an engaging property walkthrough script.',
  }

  const systemPrompt = SKILL_PROMPTS[assetType] ?? SKILL_PROMPTS.ad_copy
  const prompt = `${systemPrompt}

Property/Context: ${propertyRef}
Target Audience: ${audience || 'Egyptian real estate buyers and investors'}
Tone: ${tone || 'professional and persuasive'}
Skill focus: ${skillKey || assetType}

Generate 3 variations. Format clearly with --- between each.`

  const provider = getAIProvider(model)
  const outputText = await provider.generate(prompt, { maxTokens: 1024 })
  const providerName = model.startsWith('gemini') ? 'gemini' : 'claude'

  await supabase.from('creative_assets').insert({
    company_id: companyId,
    created_by: user.id,
    asset_type: assetType,
    prompt_used: propertyRef,
    output_text: outputText,
    provider: providerName,
    property_ref: propertyRef,
    status: 'completed',
    metadata: { audience, tone, skill_key: skillKey, model },
  })

  revalidatePath('/admin/creative-studio')
  return { success: true, output: outputText }
}

// ── HeyGen Video (stubbed — requires API key) ─────────────────
export async function generateVideoAction(formData: FormData) {
  await requirePermission('messages.create')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const heygenKey = await getCompanyKey(companyId, 'heygen')
  if (!heygenKey) return { error: 'لم يتم إعداد HeyGen API Key — أضفه من API Vault' }

  const script   = formData.get('script') as string
  const avatarId = formData.get('avatar_id') as string | null

  if (!script) return { error: 'النص مطلوب' }

  const res = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': heygenKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: 'avatar', avatar_id: avatarId ?? 'default_avatar' },
        voice: { type: 'text', input_text: script, voice_id: 'en-US-JennyNeural' },
      }],
      dimension: { width: 1280, height: 720 },
    }),
  })

  const data = await res.json() as { video_id?: string; error?: string }

  if (!res.ok || data.error) return { error: data.error ?? 'HeyGen request failed' }

  await supabase.from('creative_assets').insert({
    company_id: companyId,
    created_by: user.id,
    asset_type: 'video',
    prompt_used: script,
    provider: 'heygen',
    status: 'processing',
    metadata: { video_id: data.video_id, avatar_id: avatarId },
  })

  revalidatePath('/admin/creative-studio')
  return { success: true, videoId: data.video_id }
}
