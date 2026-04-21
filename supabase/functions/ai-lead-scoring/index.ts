import { createClient } from 'npm:@supabase/supabase-js@2'
import { generateText } from 'npm:ai'
import { openai } from 'npm:@ai-sdk/openai'

type LeadRow = {
  id: string
  company_id: string | null
  agent_id: string | null
  name: string | null
  client_name: string | null
  full_name: string | null
  status: string | null
  expected_value: number | string | null
  budget: number | string | null
  updated_at: string | null
  created_at: string | null
}

type ActivityRow = {
  lead_id: string | null
  type: string | null
  direction: string | null
  created_at: string | null
}

type DealRow = {
  lead_id: string | null
  stage: string | null
  value: number | string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('AI_CRON_SECRET')
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return Response.json({ error: 'غير مصرح' }, { status: 401, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const openAiKey = Deno.env.get('OPENAI_API_KEY')

  if (!supabaseUrl || !serviceRoleKey || !openAiKey) {
    return Response.json({ error: 'إعدادات الذكاء الاصطناعي أو Supabase غير مكتملة' }, { status: 500, headers: corsHeaders })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, company_id, agent_id, name, client_name, full_name, status, expected_value, budget, updated_at, created_at')
      .order('updated_at', { ascending: true, nullsFirst: true })
      .limit(200)

    if (leadsError) throw leadsError

    const leadRows = (leads ?? []) as LeadRow[]
    const leadIds = leadRows.map((lead) => lead.id)
    if (leadIds.length === 0) {
      return Response.json({ updated: 0, alerts: 0 }, { headers: corsHeaders })
    }

    const [{ data: activities }, { data: deals }] = await Promise.all([
      supabase
        .from('lead_activities')
        .select('lead_id, type, direction, created_at')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('deals')
        .select('lead_id, stage, value')
        .in('lead_id', leadIds),
    ])

    const activityRows = (activities ?? []) as ActivityRow[]
    const dealRows = (deals ?? []) as DealRow[]
    const now = Date.now()
    let alertCount = 0

    for (const lead of leadRows) {
      const leadActivities = activityRows.filter((activity) => activity.lead_id === lead.id)
      const leadDeals = dealRows.filter((deal) => deal.lead_id === lead.id)
      const latestContactAt = leadActivities[0]?.created_at ?? lead.updated_at ?? lead.created_at
      const responseRate = calculateResponseRate(leadActivities)
      const viewingCount = leadActivities.filter((activity) => activity.type === 'viewing' || activity.type === 'site_visit').length
      const dealStage = leadDeals[0]?.stage ?? lead.status
      const expectedValue = Number(leadDeals[0]?.value ?? lead.expected_value ?? lead.budget ?? 0)
      const daysSinceContact = daysSince(latestContactAt, now)
      const score = calculateScore({ responseRate, viewingCount, dealStage, daysSinceContact, expectedValue })
      const name = lead.name ?? lead.client_name ?? lead.full_name ?? 'عميل'
      const recommendation = await generateRecommendation({
        name,
        score,
        responseRate,
        viewingCount,
        dealStage,
        daysSinceContact,
        expectedValue,
      })

      await supabase
        .from('leads')
        .update({
          ai_score: score,
          ai_recommendation: recommendation,
          ai_scored_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (lead.company_id && lead.agent_id && (score >= 80 || daysSinceContact >= 7)) {
        const isHot = score >= 80
        await supabase.from('ai_alerts').insert({
          company_id: lead.company_id,
          agent_id: lead.agent_id,
          source_type: 'lead_scoring',
          priority: isHot ? 'high' : 'medium',
          title: isHot ? `عميل جاهز للتحويل: ${name}` : `متابعة مطلوبة مع ${name}`,
          body: recommendation,
          action_label: 'فتح العميل',
          action_link: `/dashboard/clients/${lead.id}`,
          payload: {
            lead_id: lead.id,
            score,
            response_rate: responseRate,
            viewing_count: viewingCount,
            days_since_contact: daysSinceContact,
          },
        })
        alertCount += 1
      }
    }

    return Response.json({ updated: leadRows.length, alerts: alertCount }, { headers: corsHeaders })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'تعذر تشغيل تقييم العملاء بالذكاء الاصطناعي' },
      { status: 500, headers: corsHeaders },
    )
  }
})

function calculateResponseRate(activities: ActivityRow[]) {
  const outbound = activities.filter((activity) => activity.direction === 'outbound').length
  const inbound = activities.filter((activity) => activity.direction === 'inbound').length
  if (outbound === 0) return inbound > 0 ? 100 : 35
  return Math.min(100, Math.round((inbound / outbound) * 100))
}

function calculateScore(input: {
  responseRate: number
  viewingCount: number
  dealStage: string | null
  daysSinceContact: number
  expectedValue: number
}) {
  let score = 20
  score += Math.min(30, Math.round(input.responseRate * 0.3))
  score += Math.min(20, input.viewingCount * 8)
  score += stageWeight(input.dealStage)
  score += input.expectedValue >= 5_000_000 ? 10 : input.expectedValue >= 2_000_000 ? 6 : 2

  if (input.daysSinceContact <= 1) score += 10
  else if (input.daysSinceContact <= 3) score += 6
  else if (input.daysSinceContact >= 10) score -= 18
  else if (input.daysSinceContact >= 7) score -= 10

  return Math.max(0, Math.min(100, score))
}

function stageWeight(stage: string | null) {
  const normalized = stage ?? ''
  if (['closed', 'contract', 'reservation'].includes(normalized)) return 20
  if (['offer', 'negotiation'].includes(normalized)) return 16
  if (['viewing', 'site_visit'].includes(normalized)) return 12
  if (['qualified', 'contacted'].includes(normalized)) return 8
  if (['lost', 'closed_lost'].includes(normalized)) return -20
  return 4
}

async function generateRecommendation(input: {
  name: string
  score: number
  responseRate: number
  viewingCount: number
  dealStage: string | null
  daysSinceContact: number
  expectedValue: number
}) {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: 'أنت مساعد CRM عقاري. اكتب توصية عربية مختصرة وعملية في جملة أو جملتين فقط.',
      prompt: JSON.stringify(input),
      temperature: 0.2,
    })

    return text.trim()
  } catch {
    if (input.score >= 80) return `الأولوية عالية: ${input.name} لديه مؤشرات قوية. تواصل اليوم واقترح خطوة حجز أو معاينة واضحة.`
    if (input.daysSinceContact >= 7) return `لم يحدث تواصل منذ ${input.daysSinceContact} أيام. أرسل متابعة قصيرة مع عرض مناسب وموعد اتصال محدد.`
    return `استمر في المتابعة المنتظمة مع ${input.name} وركّز على إزالة الاعتراضات قبل الانتقال للمرحلة التالية.`
  }
}

function daysSince(value: string | null | undefined, now: number) {
  if (!value) return 30
  return Math.max(0, Math.floor((now - new Date(value).getTime()) / 86400000))
}
