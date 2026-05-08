'use server'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'

export async function checkAndRemindStaleDealsAction() {
  await requirePermission('deal.view.own')
  const { profile } = await requireSession()
  const supabase    = await createRawClient()
  const companyId   = profile.company_id ?? profile.id
  const cutoff      = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: staleDeals } = await supabase
    .from('deals')
    .select('id, title, assigned_to, updated_at')
    .eq('company_id', companyId)
    .not('status', 'in', '("won","lost")')
    .lt('updated_at', cutoff)
    .limit(50)

  if (!staleDeals?.length) return { reminded: 0, deals: [] }

  const notifications = staleDeals
    .filter(d => d.assigned_to)
    .map(d => ({
      user_id:    d.assigned_to,
      company_id: companyId,
      type:       'deal_stale',
      title:      'صفقة تحتاج متابعة',
      body:       `الصفقة "${d.title}" لم تُحدَّث منذ 48 ساعة`,
      link:       `/dashboard/deals/${d.id}`,
      is_read:    false,
      metadata:   { deal_id: d.id },
    }))

  if (notifications.length) {
    await supabase.from('notifications').insert(notifications)
  }

  return {
    reminded: notifications.length,
    deals: staleDeals.map(d => ({ id: d.id, title: d.title, since: d.updated_at })),
  }
}
