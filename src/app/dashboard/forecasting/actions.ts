'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

interface MonthlyData {
  month: string
  deals: number
  revenue: number
  leads: number
}

interface ForecastResult {
  monthlyData: MonthlyData[]
  forecast: MonthlyData[]
  aiInsights: string
  totalRevenueLTM: number
  avgDealValue: number
  conversionRate: number
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' })
}

export async function getSalesForecast(): Promise<ForecastResult> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // جلب بيانات الصفقات والعملاء آخر 12 شهر
  const now = new Date()
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const { data: deals } = await supabase
    .from('deals')
    .select('unit_value, created_at, stage')
    .gte('created_at', twelveMonthsAgo.toISOString())
    .order('created_at', { ascending: true })

  const { data: leads } = await supabase
    .from('leads')
    .select('created_at')
    .gte('created_at', twelveMonthsAgo.toISOString())

  // تجميع البيانات شهرياً
  const monthMap = new Map<string, MonthlyData>()

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const label = getMonthLabel(d)
    monthMap.set(label, { month: label, deals: 0, revenue: 0, leads: 0 })
  }

  for (const deal of deals ?? []) {
    const label = getMonthLabel(new Date(deal.created_at))
    const entry = monthMap.get(label)
    if (entry) {
      entry.deals++
      entry.revenue += Number(deal.unit_value ?? 0)
    }
  }

  for (const lead of leads ?? []) {
    const label = getMonthLabel(new Date(lead.created_at))
    const entry = monthMap.get(label)
    if (entry) entry.leads++
  }

  const monthlyData = Array.from(monthMap.values())

  const totalRevenueLTM = monthlyData.reduce((s, m) => s + m.revenue, 0)
  const totalDeals = monthlyData.reduce((s, m) => s + m.deals, 0)
  const totalLeads = monthlyData.reduce((s, m) => s + m.leads, 0)
  const avgDealValue = totalDeals > 0 ? totalRevenueLTM / totalDeals : 0
  const conversionRate = totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0

  // توقع الـ 3 أشهر القادمة بمتوسط متحرك
  const last3 = monthlyData.slice(-3)
  const avgDeals = last3.reduce((s, m) => s + m.deals, 0) / 3
  const avgRevenue = last3.reduce((s, m) => s + m.revenue, 0) / 3
  const avgLeads = last3.reduce((s, m) => s + m.leads, 0) / 3

  const forecast: MonthlyData[] = []
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now)
    d.setMonth(d.getMonth() + i)
    forecast.push({
      month: getMonthLabel(d),
      deals: Math.round(avgDeals * (1 + 0.05 * i)),
      revenue: Math.round(avgRevenue * (1 + 0.05 * i)),
      leads: Math.round(avgLeads * (1 + 0.03 * i)),
    })
  }

  // تحليل الذكاء الاصطناعي
  let aiInsights = 'تعذر توليد التحليل الآن.'
  try {
    const client = new Anthropic()
    const summary = monthlyData.map(m =>
      `${m.month}: ${m.deals} صفقة, إيراد ${(m.revenue / 1_000_000).toFixed(1)}M جنيه, ${m.leads} عميل`
    ).join('\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `أنت محلل مبيعات عقارية خبير. بناءً على البيانات التالية لآخر 12 شهر، قدم تحليلاً موجزاً (3-4 جمل) باللغة العربية يتضمن: الاتجاه العام، أبرز نقاط القوة والضعف، وتوصية واحدة عملية للربع القادم.

البيانات:
${summary}

معدل التحويل الإجمالي: ${conversionRate.toFixed(1)}%
متوسط قيمة الصفقة: ${(avgDealValue / 1_000).toFixed(0)}K جنيه`
      }]
    })

    const block = message.content[0]
    if (block.type === 'text') aiInsights = block.text
  } catch {
    aiInsights = `معدل التحويل ${conversionRate.toFixed(1)}% وإجمالي الإيراد ${(totalRevenueLTM / 1_000_000).toFixed(1)} مليون جنيه خلال آخر 12 شهراً.`
  }

  return { monthlyData, forecast, aiInsights, totalRevenueLTM, avgDealValue, conversionRate }
}
