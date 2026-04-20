import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type NotifType = 'info' | 'success' | 'warning' | 'error'
type DomainNotifType = NotifType | 'deal_moved' | 'new_client' | 'commission_paid' | 'task_due' | 'mention'

interface NotifPayload {
  user_id: string
  title: string
  message?: string
  type?: DomainNotifType
  link?: string
}

interface SendNotificationPayload {
  userId: string
  type: DomainNotifType
  title: string
  body?: string
  link?: string
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

export async function createNotification(payload: NotifPayload) {
  try {
    const supabase = await getSupabase()
    await supabase.from('notifications').insert({
      user_id:  payload.user_id,
      title:    payload.title,
      message:  payload.message ?? null,
      body:     payload.message ?? null,
      type:     payload.type ?? 'info',
      link:     payload.link ?? null,
      is_read:  false,
    })
  } catch {
    // Notifications are non-critical — never throw
  }
}

export async function sendNotification(payload: SendNotificationPayload) {
  await createNotification({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.body ?? '',
    link: payload.link,
  })
}

export async function notifyLeadAssigned(agentId: string, leadName: string, leadId: string) {
  await createNotification({
    user_id: agentId,
    title:   `تم تعيين عميل جديد لك`,
    message: `العميل: ${leadName}`,
    type:    'info',
    link:    `/dashboard/leads/${leadId}`,
  })
}

export async function notifyDealClosed(agentId: string, clientName: string, dealValue: number, dealId: string) {
  const fmt = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(dealValue)
  await createNotification({
    user_id: agentId,
    title:   `تهانينا! تم إغلاق صفقة`,
    message: `العميل: ${clientName} · القيمة: ${fmt} ج.م`,
    type:    'success',
    link:    `/dashboard/deals/${dealId}`,
  })
}

export async function notifyLeadStatusChanged(agentId: string, leadName: string, newStatus: string, leadId: string) {
  await createNotification({
    user_id: agentId,
    title:   `تغيّرت حالة عميل`,
    message: `${leadName} ← ${newStatus}`,
    type:    'info',
    link:    `/dashboard/leads/${leadId}`,
  })
}

export async function notifyTargetHit(agentId: string, metric: string) {
  await createNotification({
    user_id: agentId,
    title:   `أحسنت! حققت هدفك`,
    message: `لقد بلغت 100% من هدف ${metric} لهذا الشهر`,
    type:    'success',
    link:    `/dashboard/targets`,
  })
}

export async function notifyAdmins(title: string, message: string, link?: string) {
  try {
    const supabase = await getSupabase()
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'Admin', 'company_admin', 'company', 'super_admin'])

    if (!admins?.length) return
    await supabase.from('notifications').insert(
      admins.map(a => ({ user_id: a.id, title, message, type: 'info', link: link ?? null, is_read: false }))
    )
  } catch {
    // non-critical
  }
}
