'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

export async function bulkUpdateCommissions(formData: FormData) {
  await requirePermission('admin.view')
  const status = String(formData.get('status') ?? 'approved')
  const ids = String(formData.get('ids') ?? '').split(',').filter(Boolean)
  if (ids.length === 0) return
  const supabase = await createRawClient()
  await supabase.from('commissions').update({ status, approved_at: new Date().toISOString() }).in('id', ids)
  revalidatePath('/admin/financials')
}
