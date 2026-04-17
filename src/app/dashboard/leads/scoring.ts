'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function recalculateLeadScore(leadId: string): Promise<number> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const [{ data: lead }, { data: activities }] = await Promise.all([
    supabase.from('leads').select('status, temperature, expected_value, phone, email, source').eq('id', leadId).single(),
    supabase.from('lead_activities').select('type, outcome').eq('lead_id', leadId),
  ])

  if (!lead) return 0

  let score = 0

  // Data quality (25 pts)
  if (lead.phone)          score += 10
  if (lead.email)          score += 5
  if (Number(lead.expected_value) > 0) score += 10

  // Temperature (20 pts)
  if (lead.temperature === 'hot')  score += 20
  else if (lead.temperature === 'warm') score += 10

  // Pipeline stage (30 pts)
  const stageScore: Record<string, number> = {
    'Fresh Leads': 5, 'fresh': 5,
    'Contacted':   10,
    'Interested':  15,
    'Site Visit':  25,
    'Negotiation': 30,
    'Contracted':  30,
    'Not Interested': 0,
  }
  score += stageScore[lead.status ?? 'Fresh Leads'] ?? 5

  // Activity engagement (25 pts max)
  let activityPts = 0
  for (const act of activities ?? []) {
    if (act.type === 'site_visit')                         activityPts += 15
    else if (act.type === 'meeting')                       activityPts += 10
    else if (act.type === 'call' && act.outcome === 'answered')   activityPts += 8
    else if (act.type === 'whatsapp')                      activityPts += 5
    else if (act.type === 'call')                          activityPts += 3
  }
  score += Math.min(activityPts, 25)

  const finalScore = Math.min(score, 100)

  // Persist score (ignore error if column doesn't exist yet)
  await supabase.from('leads').update({ score: finalScore }).eq('id', leadId)

  return finalScore
}
