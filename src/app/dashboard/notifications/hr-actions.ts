'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'

export async function markNotificationReadAction(notifId: string) {
  const session = await requireSession()
  const service = createServiceRoleClient()
  await service
    .from('hr_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notifId)
    .eq('recipient_id', session.user.id)
  revalidatePath('/', 'layout')
}

export async function markAllReadAction() {
  const session = await requireSession()
  const service = createServiceRoleClient()
  await service
    .from('hr_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', session.user.id)
    .eq('is_read', false)
  revalidatePath('/', 'layout')
}
