import type { SupabaseClient } from '@supabase/supabase-js'

export type HRNotifType =
  | 'leave_request'
  | 'commission_pending'
  | 'payroll_ready'
  | 'burnout_alert'
  | 'onboarding_overdue'
  | 'review_due'
  | 'document_expiry'
  | 'general'

export interface SendNotifOptions {
  companyId: string | null | undefined
  recipientId: string
  actorId?: string | null
  type: HRNotifType
  title: string
  body?: string
  link?: string
}

export async function sendHRNotification(
  service: SupabaseClient,
  opts: SendNotifOptions,
): Promise<void> {
  await service.from('hr_notifications').insert({
    company_id:   opts.companyId ?? null,
    recipient_id: opts.recipientId,
    actor_id:     opts.actorId ?? null,
    type:         opts.type,
    title:        opts.title,
    body:         opts.body ?? null,
    link:         opts.link ?? null,
    is_read:      false,
  })
}

export async function sendBulkHRNotification(
  service: SupabaseClient,
  recipientIds: string[],
  opts: Omit<SendNotifOptions, 'recipientId'>,
): Promise<void> {
  if (!recipientIds.length) return
  const rows = recipientIds.map((id) => ({
    company_id:   opts.companyId ?? null,
    recipient_id: id,
    actor_id:     opts.actorId ?? null,
    type:         opts.type,
    title:        opts.title,
    body:         opts.body ?? null,
    link:         opts.link ?? null,
    is_read:      false,
  }))
  await service.from('hr_notifications').insert(rows)
}
