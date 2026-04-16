'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type AuditAction =
  | 'lead.created' | 'lead.updated' | 'lead.deleted'
  | 'deal.created' | 'deal.updated' | 'deal.deleted'
  | 'client.created' | 'client.updated'
  | 'commission.updated'
  | 'team.member_added' | 'team.member_removed'
  | 'inventory.unit_added' | 'inventory.unit_updated'
  | 'developer.created' | 'developer.updated'

export async function logAudit(
  action: AuditAction,
  targetTable: string,
  targetId: string,
  metadata?: Record<string, unknown>
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      target_table: targetTable,
      target_id: targetId,
      metadata: metadata ?? null,
    })
  } catch {
    // audit failures must never crash the main flow
  }
}
