'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'
import Anthropic from '@anthropic-ai/sdk'

export async function addMarketDataAction(formData: FormData) {
  await requirePermission('report.view.own')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', user.id).single()
  const companyId = profile?.company_id ?? user.id

  const region        = (formData.get('region') as string)?.trim()
  const zone          = (formData.get('zone') as string)?.trim() || null
  const avg_price_sqm = Number(formData.get('avg_price_sqm')) || null
  const price_change  = Number(formData.get('price_change_pct')) || null
  const demand_level  = (formData.get('demand_level') as string) || 'medium'
  const supply_units  = Number(formData.get('supply_units')) || null
  const notes         = (formData.get('notes') as string)?.trim() || null
  const source_url    = (formData.get('source_url') as string)?.trim() || null

  if (!region) return { error: 'المنطقة مطلوبة' }

  const { error } = await supabase.from('market_intelligence').insert({
    company_id: companyId,
    region, zone, avg_price_sqm,
    price_change_pct: price_change,
    demand_level, supply_units, notes,
    source_url, source_type: 'manual',
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/market-intelligence')
  return { success: true }
}

export async function generateInsightAction(formData: FormData) {
  await requirePermission('report.view.own')

  const region    = formData.get('region') as string
  const priceData = formData.get('price_data') as string

  if (!region) return { error: 'المنطقة مطلوبة' }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are a senior real estate analyst specializing in the Egyptian property market.

Analyze the following market data for ${region} and provide:
1. Current market assessment (3 sentences)
2. Investment recommendation (buy / hold / wait)
3. Key risk factors (2 bullet points)
4. 6-month price forecast

Market Data: ${priceData || 'General market conditions in ' + region}

Respond in Arabic. Keep it concise and actionable for a sales agent.`,
    }],
  })

  const insight = message.content[0].type === 'text' ? message.content[0].text : ''
  return { success: true, insight }
}
