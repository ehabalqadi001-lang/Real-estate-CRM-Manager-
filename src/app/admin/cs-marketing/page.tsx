import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Radio, Headphones, Users, Clock, CheckCheck, Phone, Megaphone, Filter } from 'lucide-react'
import { WhatsAppSendForm, BroadcastForm } from './WhatsAppSendForm'

export const dynamic = 'force-dynamic'

export default async function CSMarketingHubPage() {
  await requirePermission('messages.read')

  const supabase = await createRawClient()

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, sender_id, recipient_id, content, created_at, is_read')
    .order('created_at', { ascending: false })
    .limit(30)

  const msgs = (messages ?? []) as { id: string; sender_id: string | null; recipient_id: string | null; content: string | null; created_at: string | null; is_read: boolean | null }[]
  const unreadCount = msgs.filter((m) => !m.is_read).length

  const { data: waLogs } = await supabase
    .from('whatsapp_logs')
    .select('id, recipient_phone, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--fi-emerald)]">CS & Marketing Hub</p>
          <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">مركز خدمة العملاء والتسويق</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">صندوق موحد + WhatsApp Business API + بث جماعي</p>
        </div>
        <Button className="fi-primary-button font-semibold">
          <Filter className="size-4" />
          فلتر متقدم
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HubKpi icon={<MessageSquare />} label="رسائل داخلية" value={String(msgs.length)} />
        <HubKpi icon={<Clock />} label="غير مقروءة" value={String(unreadCount)} accent />
        <HubKpi icon={<CheckCheck />} label="تم الرد" value={String(msgs.length - unreadCount)} />
        <HubKpi icon={<Radio />} label="رسائل WhatsApp" value={String(waLogs?.length ?? 0)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Inbox */}
        <div className="overflow-hidden rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--fi-line)] px-5 py-4">
            <p className="flex items-center gap-2 font-black text-[var(--fi-ink)]">
              <Headphones className="size-4 text-[var(--fi-emerald)]" />
              صندوق الوارد
            </p>
            {unreadCount > 0 && <Badge className="bg-[#C9964A]/10 text-[#C9964A]">{unreadCount} غير مقروء</Badge>}
          </div>
          {msgs.length === 0 ? (
            <div className="p-10 text-center">
              <MessageSquare className="mx-auto mb-3 size-10 text-[var(--fi-line)]" />
              <p className="font-semibold text-[var(--fi-muted)]">لا توجد رسائل بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--fi-line)]">
              {msgs.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 px-5 py-3 hover:bg-[var(--fi-soft)]/30 ${!msg.is_read ? 'bg-[var(--fi-soft)]/20' : ''}`}>
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--fi-soft)]">
                    <Users className="size-4 text-[var(--fi-emerald)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!msg.is_read && <span className="h-2 w-2 rounded-full bg-[#C9964A]" />}
                    </div>
                    <p className={`mt-0.5 text-sm ${!msg.is_read ? 'font-black text-[var(--fi-ink)]' : 'font-semibold text-[var(--fi-muted)]'}`}>
                      {(msg.content ?? '').slice(0, 90)}{(msg.content ?? '').length > 90 ? '…' : ''}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--fi-muted)]">
                      {msg.created_at ? new Date(msg.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* WhatsApp send */}
          <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
            <p className="mb-3 flex items-center gap-2 font-black text-[var(--fi-ink)]">
              <Phone className="size-4 text-[#25D366]" />
              WhatsApp — رسالة فردية
            </p>
            <WhatsAppSendForm />
          </div>

          {/* Broadcast */}
          <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
            <p className="mb-3 flex items-center gap-2 font-black text-[var(--fi-ink)]">
              <Megaphone className="size-4 text-[#C9964A]" />
              بث جماعي
            </p>
            <BroadcastForm />
          </div>

          {/* WA Log */}
          {waLogs && waLogs.length > 0 && (
            <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
              <p className="mb-3 font-black text-[var(--fi-ink)]">آخر رسائل WhatsApp</p>
              <div className="space-y-2">
                {waLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-lg bg-[var(--fi-soft)] px-3 py-2 text-xs">
                    <span className="font-semibold text-[var(--fi-muted)]" dir="ltr">{log.recipient_phone}</span>
                    <Badge className={log.status === 'sent' ? 'bg-[var(--fi-soft)] text-[var(--fi-emerald)]' : 'bg-[#C9964A]/10 text-[#C9964A]'}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HubKpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${accent ? 'border-[#C9964A]/30 bg-[#C9964A]/5' : 'border-[var(--fi-line)] bg-[var(--fi-paper)]'}`}>
      <div className={`mb-2 ${accent ? 'text-[#C9964A]' : 'text-[var(--fi-emerald)]'}`}>{icon}</div>
      <p className={`text-3xl font-black ${accent ? 'text-[#C9964A]' : 'text-[var(--fi-ink)]'}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}
