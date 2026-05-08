import { NextResponse } from 'next/server'
import { createRawClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Called by Vercel Cron: every hour
// vercel.json: { "crons": [{ "path": "/api/cron/deal-reminders", "schedule": "0 * * * *" }] }
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createRawClient()
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  // Find deals with no activity in the last 48h, not yet won/lost
  const { data: staleDeals } = await supabase
    .from('deals')
    .select('id, title, assigned_to, company_id, updated_at')
    .not('status', 'in', '("won","lost")')
    .lt('updated_at', cutoff)
    .limit(100)

  if (!staleDeals?.length) return NextResponse.json({ reminded: 0 })

  // Create notification for each stale deal's assigned user
  const notifications = staleDeals
    .filter(d => d.assigned_to)
    .map(d => ({
      user_id:    d.assigned_to,
      company_id: d.company_id,
      type:       'deal_stale',
      title:      'صفقة تحتاج متابعة',
      body:       `الصفقة "${d.title}" لم تُحدَّث منذ 48 ساعة — تابع الآن`,
      link:       `/dashboard/deals/${d.id}`,
      is_read:    false,
      metadata:   { deal_id: d.id, stale_since: d.updated_at },
    }))

  if (notifications.length) {
    await supabase.from('notifications').insert(notifications)
  }

  return NextResponse.json({ reminded: notifications.length })
}
