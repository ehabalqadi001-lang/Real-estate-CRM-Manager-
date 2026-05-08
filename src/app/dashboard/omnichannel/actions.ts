'use server'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'

export async function markMessageReadAction(messageId: string) {
  await requirePermission('messages.read')
  const supabase = await createRawClient()
  await supabase.from('chat_messages').update({ is_read: true }).eq('id', messageId)
  revalidatePath('/dashboard/omnichannel')
}

export async function sendReplyAction(formData: FormData) {
  await requirePermission('messages.create')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const channel     = formData.get('channel') as string
  const recipientId = formData.get('recipient_id') as string | null
  const content     = (formData.get('content') as string)?.trim()

  if (!content) return { error: 'محتوى الرسالة مطلوب' }

  if (channel === 'internal') {
    const { error } = await supabase.from('chat_messages').insert({
      sender_id:    user.id,
      recipient_id: recipientId ?? null,
      content,
      is_read:      false,
    })
    if (error) return { error: error.message }
  } else if (channel === 'whatsapp') {
    const phone = formData.get('phone') as string
    const WA_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN
    const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!WA_TOKEN || !WA_PHONE_ID) return { error: 'WhatsApp API غير مكتمل' }
    const res = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'text', text: { body: content } }),
    })
    const data = await res.json() as { messages?: { id: string }[]; error?: { message: string } }
    if (!res.ok) return { error: data.error?.message ?? 'فشل الإرسال' }
    await supabase.from('whatsapp_logs').insert({ recipient_phone: phone, message: content, status: 'sent', provider: 'meta', message_id: data.messages?.[0]?.id })
  }

  revalidatePath('/dashboard/omnichannel')
  return { success: true }
}

export async function generateAIReplyAction(context: string): Promise<{ reply?: string; error?: string }> {
  await requirePermission('messages.read')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `أنت ممثل خدمة عملاء محترف في شركة عقارية مصرية. اكتب رداً احترافياً قصيراً ومناسباً على الرسالة التالية:

"${context}"

الرد يجب أن يكون:
- باللغة العربية
- مهنياً ومتعاطفاً
- موجزاً (2-3 جمل)
- يقدم قيمة أو يطلب تفاصيل إضافية إذا لزم`,
    }],
  })
  const reply = message.content[0].type === 'text' ? message.content[0].text : ''
  return { reply }
}
