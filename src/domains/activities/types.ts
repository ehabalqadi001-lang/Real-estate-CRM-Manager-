export interface ActivityLeadSummary {
  id: string
  client_name: string | null
  phone: string | null
}

export interface ActivityListItem {
  id: string
  lead_id: string | null
  type: string
  notes: string | null
  outcome: string | null
  scheduled_at: string
  done_at: string
  leads: ActivityLeadSummary | null
}

export interface ActivityBoard {
  pendingActivities: ActivityListItem[]
  completedActivities: ActivityListItem[]
}
