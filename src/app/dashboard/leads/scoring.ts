'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

function computeScore(
  lead: { status?: string | null; temperature?: string | null; expected_value?: string | number | null; phone?: string | null; email?: string | null },
  activities: { type?: string | null; outcome?: string | null }[]
): number {
  let score = 0

  if (lead.phone)                           score += 10
  if (lead.email)                           score += 5
  if (Number(lead.expected_value) > 0)      score += 10

  if (lead.temperature === 'hot')           score += 20
  else if (lead.temperature === 'warm')     score += 10

  const stageScore: Record<string, number> = {
    'Fresh Leads': 5, 'fresh': 5, 'Contacted': 10, 'Interested': 15,
    'Site Visit': 25, 'Negotiation': 30, 'Contracted': 30, 'Not Interested': 0,
  }
  score += stageScore[lead.status ?? 'Fresh Leads'] ?? 5

  let activityPts = 0
  for (const act of activities) {
    if (act.type === 'site_visit')                              activityPts += 15
    else if (act.type === 'meeting')                           activityPts += 10
    else if (act.type === 'call' && act.outcome === 'answered') activityPts += 8
    else if (act.type === 'whatsapp')                          activityPts += 5
    else if (act.type === 'call')                              activityPts += 3
  }
  score += Math.min(activityPts, 25)

  return Math.min(score, 100)
}

export async function rescoreAllLeads(): Promise<{ updated: number }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user?.id).single()
  const companyId = profile?.company_id || user?.id

  const [{ data: leads }, { data: activities }] = await Promise.all([
    supabase.from('leads')
      .select('id, status, temperature, expected_value, phone, email')
      .or(`company_id.eq.${companyId},user_id.eq.${user?.id}`),
    supabase.from('lead_activities')
      .select('lead_id, type, outcome'),
  ])

  if (!leads?.length) return { updated: 0 }

  const actMap = new Map<string, { type?: string | null; outcome?: string | null }[]>()
  for (const a of activities ?? []) {
    if (!actMap.has(a.lead_id)) actMap.set(a.lead_id, [])
    actMap.get(a.lead_id)!.push(a)
  }

  const updates = leads.map(l => ({
    id: l.id,
    score: computeScore(l, actMap.get(l.id) ?? []),
  }))

  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50)
    await Promise.all(batch.map(u => supabase.from('leads').update({ score: u.score }).eq('id', u.id)))
  }

  revalidatePath('/dashboard/leads')
  return { updated: updates.length }
}

export async function recalculateLeadScore(leadId: string): Promise<number> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const [{ data: lead }, { data: activities }] = await Promise.all([
    supabase.from('leads').select('status, temperature, expected_value, phone, email').eq('id', leadId).single(),
    supabase.from('lead_activities').select('type, outcome').eq('lead_id', leadId),
  ])

  if (!lead) return 0

  const finalScore = computeScore(lead, activities ?? [])
  await supabase.from('leads').update({ score: finalScore }).eq('id', leadId)
  return finalScore
}
