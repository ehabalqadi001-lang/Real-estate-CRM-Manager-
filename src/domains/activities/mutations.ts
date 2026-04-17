import 'server-only'

import { requireSession } from '@/shared/auth/session'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { ActionResult } from '@/shared/types/action-result'

export async function completeActivity(activityId: string): Promise<ActionResult> {
  const session = await requireSession()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('activities')
    .update({
      done_at: new Date().toISOString(),
      outcome: 'completed',
    })
    .eq('id', activityId)
    .eq('agent_id', session.user.id)

  if (error) {
    return { ok: false, error: error.message, code: 'DATABASE_ERROR' }
  }

  return { ok: true, data: undefined }
}
