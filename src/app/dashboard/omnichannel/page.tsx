import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { MessageCircle, Phone, Mail, Users } from 'lucide-react'
import { OmnichannelClient } from './OmnichannelClient'

export const dynamic = 'force-dynamic'

export default async function OmnichannelInboxPage() {
  await requirePermission('messages.read')
  const supabase = await createRawClient()

  const [{ data: messagesRaw }, { data: waLogsRaw }] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('id, sender_id, recipient_id, content, created_at, is_read')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('whatsapp_logs')
      .select('id, recipient_phone, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const messages = (messagesRaw ?? []) as {
    id: string; sender_id: string | null; recipient_id: string | null
    content: string | null; created_at: string | null; is_read: boolean | null
  }[]
  const waLogs = (waLogsRaw ?? []) as {
    id: string; recipient_phone: string | null; message: string | null
    status: string | null; created_at: string | null
  }[]

  const unreadInternal = messages.filter(m => !m.is_read).length
  const totalChannels  = 2
  const totalMessages  = messages.length + waLogs.length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[#0F8F83]">NEXUS Omnichannel</p>
        <h1 className="mt-1 text-xl sm:text-3xl font-black text-[#102033] dark:text-white">صندوق الوارد الموحد</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          إدارة جميع القنوات — واتساب، بريد إلكتروني، ورسائل داخلية — من مكان واحد مع ردود AI.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: <MessageCircle className="size-5" />, value: messages.length, label: 'رسائل داخلية',   color: 'text-[#0F8F83]' },
          { icon: <Phone className="size-5" />,         value: waLogs.length,   label: 'رسائل WhatsApp', color: 'text-[#25D366]' },
          { icon: <Mail className="size-5" />,          value: 0,               label: 'بريد إلكتروني',  color: 'text-[#C9964A]' },
          { icon: <Users className="size-5" />,         value: unreadInternal,  label: 'غير مقروء',      color: 'text-red-500' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className={`mb-2 ${k.color}`}>{k.icon}</div>
            <p className="text-2xl font-black text-[#102033] dark:text-white">{k.value}</p>
            <p className="text-xs font-semibold text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <OmnichannelClient messages={messages} waLogs={waLogs} />
    </div>
  )
}
