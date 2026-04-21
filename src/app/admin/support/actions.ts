'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function updateTicket(formData: FormData) {
  await requirePermission('admin.view')
  const id = String(formData.get('id') ?? '')
  const supabase = await createRawClient()
  const status = String(formData.get('status') ?? 'open')
  await supabase.from('support_tickets').update({
    status,
    priority: String(formData.get('priority') ?? 'medium'),
    assigned_to: String(formData.get('assigned_to') ?? '') || null,
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
  }).eq('id', id)
  revalidatePath('/admin/support')
}
