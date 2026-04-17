'use server'

import { revalidatePath } from 'next/cache'
import { completeActivity } from '@/domains/activities/mutations'

export async function markActivityAsDone(activityId: string) {
  const result = await completeActivity(activityId)

  if (!result.ok) {
    throw new Error(result.error)
  }

  revalidatePath('/dashboard/activities')
  return { success: true }
}
