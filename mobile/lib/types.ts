export type PipelineStage = 'new' | 'contacted' | 'viewing' | 'offer' | 'contract' | 'closed' | 'lost'

export type MobileClient = {
  id: string
  name: string
  phone: string | null
  status: string | null
  created_at: string | null
}

export type MobileDeal = {
  id: string
  title: string
  stage: PipelineStage
  value: number
  client_name: string | null
  project_name: string | null
  updated_at: string | null
  created_at: string | null
}

export type MobileTask = {
  id: string
  title: string
  due_date: string | null
  status: string | null
}

export type OfflineAction =
  | {
      id: string
      type: 'update_stage'
      payload: { dealId: string; stage: PipelineStage }
      createdAt: string
    }
  | {
      id: string
      type: 'add_note'
      payload: { dealId: string; note: string }
      createdAt: string
    }
