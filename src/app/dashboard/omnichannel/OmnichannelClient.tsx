'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { sendReplyAction, generateAIReplyAction, markMessageReadAction } from './actions'
import { Send, Wand2, CheckCircle2, MessageCircle, Phone, Mail, Loader2, AlertCircle } from 'lucide-react'

interface ChatMessage {
  id: string
  sender_id: string | null
  recipient_id: string | null
  content: string | null
  created_at: string | null
  is_read: boolean | null
}

interface WaLog {
  id: string
  recipient_phone: string | null
  message: string | null
  status: string | null
  created_at: string | null
}

interface Props {
  messages: ChatMessage[]
  waLogs: WaLog[]
}

type Tab = 'internal' | 'whatsapp'

export function OmnichannelClient({ messages, waLogs }: Props) {
  const [tab, setTab] = useState<Tab>('internal')
  const [selected, setSelected] = useState<ChatMessage | WaLog | null>(null)
  const [reply, setReply] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, start] = useTransition()

  const handleAIReply = async () => {
    const content = tab === 'internal'
      ? (selected as ChatMessage)?.content ?? ''
      : (selected as WaLog)?.message ?? ''
    if (!content) return
    setAiLoading(true)
    const res = await generateAIReplyAction(content)
    if (res.reply) setReply(res.reply)
    setAiLoading(false)
  }

  const handleSend = () => {
    if (!reply.trim()) return
    const fd = new FormData()
    fd.set('content', reply)
    fd.set('channel', tab)
    if (tab === 'whatsapp' && selected) fd.set('phone', (selected as WaLog).recipient_phone ?? '')
    if (tab === 'internal' && selected) fd.set('recipient_id', (selected as ChatMessage).sender_id ?? '')
    start(async () => {
      const res = await sendReplyAction(fd)
      if (res?.error) setResult({ ok: false, msg: res.error })
      else { setResult({ ok: true, msg: 'تم الإرسال بنجاح' }); setReply('') }
    })
  }

  const handleMarkRead = (id: string) => {
    start(() => markMessageReadAction(id))
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'internal', label: 'داخلي', icon: <MessageCircle className="size-3.5" />, count: messages.filter(m => !m.is_read).length },
    { key: 'whatsapp', label: 'WhatsApp', icon: <Phone className="size-3.5" />, count: 0 },
  ]

  const items = tab === 'internal' ? messages : waLogs

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      {/* Left: Conversation list */}
      <div className="overflow-hidden rounded-xl border border-[#DDE6E4] bg-white shadow-sm dark:bg-slate-900">
        {/* Tabs */}
        <div className="flex border-b border-[#DDE6E4]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelected(null); setReply('') }}
              className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-black transition-colors ${tab === t.key ? 'border-b-2 border-[#0F8F83] text-[#0F8F83]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.icon}{t.label}
              {t.count > 0 && <span className="ml-1 rounded-full bg-[#C9964A] px-1.5 py-0.5 text-[10px] font-black text-white">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y divide-[#DDE6E4]">
          {items.length === 0 && (
            <p className="p-8 text-center text-xs font-semibold text-slate-400">لا توجد رسائل</p>
          )}
          {tab === 'internal' && (messages as ChatMessage[]).map((msg) => (
            <button
              key={msg.id}
              onClick={() => { setSelected(msg); if (!msg.is_read) handleMarkRead(msg.id) }}
              className={`w-full px-4 py-3 text-right hover:bg-[#EEF6F5]/30 transition-colors ${selected && 'id' in selected && selected.id === msg.id ? 'bg-[#EEF6F5]/40' : ''} ${!msg.is_read ? 'bg-[#EEF6F5]/10' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black ${!msg.is_read ? 'text-[#102033] dark:text-white' : 'text-slate-500'}`}>
                  {!msg.is_read && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#C9964A]" />}
                  رسالة داخلية
                </span>
                <span className="text-[10px] text-slate-400">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">{(msg.content ?? '').slice(0, 60)}</p>
            </button>
          ))}
          {tab === 'whatsapp' && (waLogs as WaLog[]).map((log) => (
            <button
              key={log.id}
              onClick={() => setSelected(log)}
              className={`w-full px-4 py-3 text-right hover:bg-[#EEF6F5]/30 transition-colors ${selected && 'id' in selected && selected.id === log.id ? 'bg-[#EEF6F5]/40' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200" dir="ltr">{log.recipient_phone}</span>
                <Badge className={`text-[10px] ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{log.status}</Badge>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">{(log.message ?? '').slice(0, 60)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Conversation view + reply */}
      <div className="flex flex-col gap-4">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#DDE6E4] py-24 text-center">
            <div>
              <Mail className="mx-auto mb-3 size-10 text-slate-200" />
              <p className="font-semibold text-slate-400">اختر محادثة من القائمة</p>
            </div>
          </div>
        ) : (
          <>
            {/* Message display */}
            <div className="rounded-xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">
                  {tab === 'internal' ? 'رسالة داخلية' : `WhatsApp — ${(selected as WaLog).recipient_phone}`}
                </p>
                <span className="text-xs text-slate-400">
                  {'created_at' in selected && selected.created_at ? new Date(selected.created_at).toLocaleString('ar-EG') : ''}
                </span>
              </div>
              <p className="text-sm font-semibold leading-7 text-[#102033] dark:text-white">
                {tab === 'internal' ? (selected as ChatMessage).content : (selected as WaLog).message}
              </p>
            </div>

            {/* Reply box */}
            <div className="rounded-xl border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-[#102033] dark:text-white">الرد</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAIReply}
                  disabled={aiLoading}
                  className="gap-1.5 text-xs text-[#0F8F83] border-[#0F8F83]/30 hover:bg-[#EEF6F5]"
                >
                  {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                  رد ذكي بالـ AI
                </Button>
              </div>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="اكتب ردك هنا…"
                rows={3}
                className="resize-none text-sm"
              />
              {result && (
                <p className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-[#0F8F83]' : 'text-red-600'}`}>
                  {result.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                  {result.msg}
                </p>
              )}
              <Button
                disabled={pending || !reply.trim()}
                onClick={handleSend}
                className="w-full bg-[#0F8F83] font-semibold text-white hover:bg-[#0B6F66]"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                إرسال الرد
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
