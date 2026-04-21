import type { LeadScoreInput, LeadScoreOutput } from './types'

const STAGE_POINTS: Record<string, number> = {
  new: 8,
  lead: 8,
  contacted: 16,
  qualified: 24,
  viewing: 36,
  site_visit: 36,
  offer: 48,
  proposal: 48,
  negotiation: 56,
  contract: 72,
  reservation: 72,
  closed: 100,
}

export function calculateLeadScore(input: LeadScoreInput): LeadScoreOutput {
  const responseScore = Math.min(25, Math.max(0, input.responseRate) * 25)
  const viewingScore = Math.min(20, input.viewingCount * 8)
  const stageScore = STAGE_POINTS[input.dealStage ?? input.status ?? 'new'] ?? 10
  const valueScore = input.expectedValue >= 5000000 ? 12 : input.expectedValue >= 2000000 ? 8 : input.expectedValue > 0 ? 5 : 0
  const recencyPenalty = input.daysSinceContact > 14 ? 22 : input.daysSinceContact > 7 ? 14 : input.daysSinceContact > 3 ? 6 : 0

  const score = Math.max(0, Math.min(100, Math.round(responseScore + viewingScore + stageScore + valueScore - recencyPenalty)))

  return {
    score,
    recommendation: buildRecommendation(input, score),
  }
}

function buildRecommendation(input: LeadScoreInput, score: number) {
  if (score >= 80) {
    return `أولوية عالية: ${input.name} قريب من قرار الشراء. اقترح موعد معاينة أو عرض دفع واضح اليوم.`
  }

  if (score >= 55) {
    return `فرصة جيدة: تابع ${input.name} برسالة قصيرة تعرض أفضل وحدة مناسبة وموعد اتصال محدد.`
  }

  if (input.daysSinceContact > 7) {
    return `يحتاج إنعاش: لم يحدث تواصل فعال منذ ${input.daysSinceContact} أيام. ابدأ برسالة متابعة خفيفة ثم مكالمة.`
  }

  return `فرصة مبكرة: اجمع احتياجات العميل بدقة قبل دفعه إلى معاينة أو عرض سعر.`
}
