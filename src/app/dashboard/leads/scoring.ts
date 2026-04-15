'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// خوارزمية حساب نقاط العميل (AI Lead Scoring)
export async function recalculateLeadScore(leadId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. جلب بيانات العميل والمهام المرتبطة به
  const { data: lead } = await supabase.from('leads').select('*, clients(*)').eq('id', leadId).single()
  const { data: activities } = await supabase.from('activities').select('*').eq('lead_id', leadId)

  if (!lead) return

  let score = 0

  // --- أ. نقاط جودة البيانات (Data Quality) ---
  if (lead.clients?.phone) score += 10
  if (lead.clients?.email) score += 5
  if (lead.expected_value > 0) score += 10

  // --- ب. نقاط التفاعل (Engagement Activity) ---
  const safeActivities = activities || []
  safeActivities.forEach((act: { type: string; outcome?: string }) => {
    if (act.type === 'whatsapp') score += 5
    if (act.type === 'call' && act.outcome === 'completed') score += 10
    if (act.type === 'visit' && act.outcome === 'completed') score += 25 // الزيارة الميدانية تعني جدية عالية
  })

  // --- ج. نقاط مرحلة التفاوض (Pipeline Stage) ---
  switch (lead.status) {
    case 'new': score += 5; break;
    case 'contacted': score += 15; break;
    case 'visit': score += 30; break;
    case 'negotiation': score += 40; break;
    case 'won': score = 100; break; // الصفقة المغلقة تأخذ العلامة الكاملة
    case 'lost': score = 0; break;  // الصفقة الضائعة تفقد قيمتها
  }

  // التأكد من أن النقاط لا تتجاوز 100
  const finalScore = Math.min(score, 100)

  // 2. تحديث النقاط في قاعدة البيانات
  await supabase.from('leads').update({ score: finalScore }).eq('id', leadId)

  return finalScore
}