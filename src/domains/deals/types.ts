import { z } from 'zod'

export const DEAL_STAGES = [
  'lead',
  'qualified',
  'site_visit',
  'proposal',
  'negotiation',
  'reservation',
  'contract',
  'closed_won',
  'closed_lost',
] as const

export type DealStage = (typeof DEAL_STAGES)[number]

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  lead:         'عميل محتمل',
  qualified:    'مؤهّل',
  site_visit:   'زيارة موقع',
  proposal:     'عرض مقدّم',
  negotiation:  'مفاوضة',
  reservation:  'محجوز',
  contract:     'عقد',
  closed_won:   'صفقة مغلقة ✓',
  closed_lost:  'خسرنا',
}

export const DEAL_STAGE_PROBABILITY: Record<DealStage, number> = {
  lead:         10,
  qualified:    25,
  site_visit:   40,
  proposal:     55,
  negotiation:  70,
  reservation:  85,
  contract:     95,
  closed_won:   100,
  closed_lost:  0,
}

// ─── Zod Schemas ────────────────────────────────────────────────────
export const CreateDealFromLeadSchema = z.object({
  lead_id:            z.string().uuid('معرّف العميل غير صالح'),
  unit_id:            z.string().uuid('معرّف الوحدة غير صالح').optional(),
  unit_value:         z.number().positive('قيمة الصفقة يجب أن تكون موجبة').optional(),
  stage:              z.enum(DEAL_STAGES).default('lead'),
  notes:              z.string().max(1000).optional(),
  expected_close_date: z.string().optional(), // ISO date
  probability:        z.number().min(0).max(100).optional(),
  source:             z.string().optional(),
})

export type CreateDealFromLeadInput = z.infer<typeof CreateDealFromLeadSchema>

export const UpdateDealStageSchema = z.object({
  deal_id:  z.string().uuid(),
  stage:    z.enum(DEAL_STAGES),
  notes:    z.string().optional(),
})

export type UpdateDealStageInput = z.infer<typeof UpdateDealStageSchema>

// ─── Response Types ──────────────────────────────────────────────────
export interface DealListItem {
  id: string
  stage: DealStage
  unit_value: number | null
  probability: number
  expected_close_date: string | null
  actual_close_date: string | null
  created_at: string
  lead_id: string | null
  unit_id: string | null
  agent_id: string | null
  company_id: string | null
  notes: string | null
  // Joined
  client_name?: string | null
  client_phone?: string | null
  agent_name?: string | null
  unit_name?: string | null
  project_name?: string | null
}

export interface DealKanbanColumn {
  stage: DealStage
  label: string
  deals: DealListItem[]
  totalValue: number
}

export interface DealKanbanBoard {
  columns: DealKanbanColumn[]
  totalPipelineValue: number
  totalDeals: number
}
