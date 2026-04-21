'use server'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── WhatsApp Business Cloud API (Meta) ───────────────────────
const WA_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WA_API_URL  = `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`

export async function sendWhatsAppMessage(formData: FormData) {
  await requirePermission('messages.whatsapp')

  const to      = (formData.get('to') as string | null)?.replace(/\D/g, '')
  const body    = formData.get('body') as string | null
  const userId  = formData.get('user_id') as string | null

  if (!to || !body) return { error: 'رقم الهاتف والرسالة مطلوبان' }
  if (!WA_TOKEN || !WA_PHONE_ID) return { error: 'إعداد WhatsApp API غير مكتمل — أضف WHATSAPP_ACCESS_TOKEN و WHATSAPP_PHONE_NUMBER_ID في env' }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body },
  }

  const res = await fetch(WA_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json() as { messages?: { id: string }[]; error?: { message: string } }

  if (!res.ok || data.error) {
    return { error: data.error?.message ?? 'فشل إرسال الرسالة' }
  }

  // Log to whatsapp_logs
  const supabase = await createRawClient()
  await supabase.from('whatsapp_logs').insert({
    recipient_phone: to,
    message: body,
    status: 'sent',
    provider: 'meta',
    message_id: data.messages?.[0]?.id ?? null,
    user_id: userId ?? null,
  })

  revalidatePath('/admin/cs-marketing')
  return { success: true, messageId: data.messages?.[0]?.id }
}

// ── Bulk broadcast ───────────────────────────────────────────
export async function sendBroadcast(formData: FormData) {
  await requirePermission('messages.broadcast')

  const body    = formData.get('body') as string | null
  const segment = formData.get('segment') as string | null

  if (!body) return { error: 'نص الرسالة مطلوب' }
  if (!WA_TOKEN || !WA_PHONE_ID) return { error: 'إعداد WhatsApp API غير مكتمل' }

  const supabase = await createRawClient()

  // Fetch users for the target segment from the canonical RBAC table.
  let query = supabase.from('user_profiles').select('id, full_name, status')
  if (segment === 'active') {
    query = query.eq('status', 'active')
  }
  const { data: users } = await query.limit(500)
  if (!users?.length) return { error: 'لا يوجد مستخدمون في هذا القطاع' }

  // In production: queue each message via a job queue (Vercel Queues / pg_cron)
  // For now we log the broadcast intent and return count
  await supabase.from('whatsapp_logs').insert({
    recipient_phone: 'broadcast',
    message: body,
    status: 'queued',
    provider: 'meta',
    message_id: `broadcast_${Date.now()}`,
  })

  revalidatePath('/admin/cs-marketing')
  return { success: true, queued: users.length }
}

// ── Internal message ─────────────────────────────────────────
export async function sendInternalMessage(formData: FormData) {
  await requirePermission('messages.create')

  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const recipientId = formData.get('recipient_id') as string | null
  const content     = formData.get('content') as string | null

  if (!content) return { error: 'محتوى الرسالة مطلوب' }

  const { error } = await supabase.from('chat_messages').insert({
    sender_id:    user.id,
    recipient_id: recipientId ?? null,
    content,
    is_read:      false,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/cs-marketing')
  return { success: true }
}
