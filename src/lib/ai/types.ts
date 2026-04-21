export type AiPriority = 'critical' | 'high' | 'medium' | 'low'

export type AiAlert = {
  priority: AiPriority
  title: string
  body: string
  action_label: string
  action_link: string
}

export type LeadScoreInput = {
  id: string
  name: string
  status: string | null
  responseRate: number
  viewingCount: number
  dealStage: string | null
  daysSinceContact: number
  expectedValue: number
}

export type LeadScoreOutput = {
  score: number
  recommendation: string
}

export type PropertyDescriptionInput = {
  projectName: string
  area: number
  bedrooms: number | null
  price: number
  finishing: string | null
  unitType?: string | null
  city?: string | null
}

export type FollowUpMessageInput = {
  clientName: string
  dealStage: string
  lastContactDate: string | null
  propertyInterest: string | null
  objections: string | null
}

export type PriceAnalysisInput = {
  unitId?: string
  projectId?: string | null
  unitType: string | null
  areaSqm: number
  price: number
  city?: string | null
  finishing?: string | null
}

export type PriceAnalysisResult = {
  verdict: string
  summary: string
  differencePercentage: number
  comparableCount: number
  recommendations: string[]
}

export type WeeklyInsightsResult = {
  achievements: string[]
  attention_deals: string[]
  next_week_forecast: string[]
  coaching_tip: string
}
