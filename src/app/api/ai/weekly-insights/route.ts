import { generateText } from 'ai'
import { getCurrentSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { extractJsonObject, getCrmOpenAiModel } from '@/lib/ai/openai'
import { sendWeeklyInsightsEmail } from '@/lib/ai/weekly-insights-email'
import type { WeeklyInsightsResult } from '@/lib/ai/types'

export const runtime = 'nodejs'

export async function POST() {
  const session = await getCurrentSession()
  if (!session) return Response.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const supabase = await createServerSupabaseClient()
    const companyId = session.profile.company_id ?? session.user.id
    const { weekStart, weekEnd } = getWeekWindow()

    const [dealsResult, leadsResult, commissionsResult] = await Promise.all([
      supabase
        .from('deals')
        .select('id, title, stage, value, amount, unit_value, final_price, updated_at, created_at')
        .eq('company_id', companyId)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .limit(100),
      supabase
        .from('leads')
        .select('id, name, client_name, full_name, status, ai_score, created_at, updated_at')
        .eq('company_id', companyId)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .limit(100),
      supabase
        .from('commissions')
        .select('id, status, amount, total_amount, gross_commission, created_at')
        .eq('company_id', companyId)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .limit(100),
    ])

    if (dealsResult.error) throw new Error(dealsResult.error.message)
    if (leadsResult.error) throw new Error(leadsResult.error.message)
    if (commissionsResult.error) throw new Error(commissionsResult.error.message)

    const fallback: WeeklyInsightsResult = {
      achievements: ['تم تسجيل نشاط أسبوعي جديد داخل النظام.'],
      attention_deals: ['راجع الصفقات غير المغلقة ورتب أولويات المتابعة.'],
      next_week_forecast: ['التركيز على العملاء الأعلى نية سيرفع فرص الإغلاق.'],
      coaching_tip: 'خصص أول ساعة يومياً للمتابعة مع العملاء الأقرب للقرار.',
    }

    const { text } = await generateText({
      model: getCrmOpenAiModel(),
      system: 'أنت مدير مبيعات عقارية يكتب تقارير أسبوعية عربية مختصرة وعملية. أعد JSON فقط بدون Markdown.',
      prompt: `أنشئ تقريراً أسبوعياً للوكيل.
الفترة: ${weekStart.toISOString()} إلى ${weekEnd.toISOString()}
الصفقات: ${JSON.stringify(dealsResult.data ?? [])}
العملاء: ${JSON.stringify(leadsResult.data ?? [])}
العمولات: ${JSON.stringify(commissionsResult.data ?? [])}
أعد JSON بهذا الشكل:
{"achievements":["..."],"attention_deals":["..."],"next_week_forecast":["..."],"coaching_tip":"..."}`,
      temperature: 0.35,
    })

    const insights = extractJsonObject<WeeklyInsightsResult>(text, fallback)
    const weekStartDate = weekStart.toISOString().slice(0, 10)

    await supabase.from('ai_weekly_insights').upsert({
      company_id: companyId,
      agent_id: session.user.id,
      week_start: weekStartDate,
      week_end: weekEnd.toISOString().slice(0, 10),
      achievements: insights.achievements,
      attention_deals: insights.attention_deals,
      next_week_forecast: insights.next_week_forecast,
      coaching_tip: insights.coaching_tip,
      raw_text: text,
      emailed_at: new Date().toISOString(),
    }, { onConflict: 'agent_id,week_start' })

    if (session.user.email) {
      await sendWeeklyInsightsEmail({
        to: session.user.email,
        agentName: session.profile.full_name ?? session.user.email,
        weekLabel: `${weekStartDate} - ${weekEnd.toISOString().slice(0, 10)}`,
        insights,
      })
    }

    return Response.json({ insights })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'تعذر إنشاء التقرير الأسبوعي' }, { status: 500 })
  }
}

function getWeekWindow() {
  const now = new Date()
  const day = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - day)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { weekStart: start, weekEnd: end }
}
