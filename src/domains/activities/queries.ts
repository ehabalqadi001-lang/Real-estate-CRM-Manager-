import 'server-only'

import { requireSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { ActivityBoard, ActivityListItem } from './types'

export async function getMyActivityBoard(): Promise<ActivityBoard> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('activities')
    .select('id, lead_id, type, notes, outcome, scheduled_at, done_at, leads(id, client_name, phone)')
    .eq('agent_id', session.user.id)
    .order('scheduled_at', { ascending: true })

  const activities = (data ?? []).map((activity) => ({
    ...activity,
    done_at: activity.done_at ?? activity.scheduled_at,
    leads: Array.isArray(activity.leads) ? (activity.leads[0] ?? null) : activity.leads,
  })) as ActivityListItem[]

  return {
    pendingActivities: activities.filter((activity) => activity.outcome === 'pending'),
    completedActivities: activities.filter((activity) => activity.outcome === 'completed'),
  }
}
