'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { sendWhatsAppMessage, sendBroadcast } from './actions'

export function WhatsAppSendForm() {
  const [phone, setPhone] = useState('')
  const [body, setBody]   = useState('')
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, start]  = useTransition()

  const handleSend = () => {
    if (!phone || !body) return
    setResult(null)
    const fd = new FormData()
    fd.set('to', phone)
    fd.set('body', body)
    start(async () => {
      const res = await sendWhatsAppMessage(fd)
      if (res?.error) setResult({ ok: false, msg: res.error })
      else { setResult({ ok: true, msg: 'تم الإرسال بنجاح' }); setPhone(''); setBody('') }
    })
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="+201XXXXXXXXX"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        dir="ltr"
        className="text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="اكتب رسالتك هنا…"
        rows={3}
        className="w-full resize-none rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 py-2 text-sm font-semibold text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
      />
      {result && (
        <p className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-[var(--fi-emerald)]' : 'text-red-600'}`}>
          {result.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
          {result.msg}
        </p>
      )}
      <Button
        size="sm"
        disabled={pending || !phone || !body}
        onClick={handleSend}
        className="w-full bg-[#25D366] font-semibold text-white hover:bg-[#1aaa50]"
      >
        <Send className="size-3.5" />
        {pending ? 'جاري الإرسال…' : 'إرسال عبر WhatsApp'}
      </Button>
    </div>
  )
}

export function BroadcastForm() {
  const [body, setBody]     = useState('')
  const [segment, setSegment] = useState('all')
  const [result, setResult]  = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, start]    = useTransition()

  const handleBroadcast = () => {
    if (!body) return
    setResult(null)
    const fd = new FormData()
    fd.set('body', body)
    fd.set('segment', segment)
    start(async () => {
      const res = await sendBroadcast(fd)
      if (res?.error) setResult({ ok: false, msg: res.error })
      else setResult({ ok: true, msg: `تم إضافة ${res.queued} رسالة للطابور` })
    })
  }

  return (
    <div className="space-y-3">
      <select
        value={segment}
        onChange={(e) => setSegment(e.target.value)}
        className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 py-2 text-sm font-semibold"
      >
        <option value="all">كل المستخدمين</option>
        <option value="active">المستخدمون النشطون</option>
      </select>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="نص الحملة…"
        rows={3}
        className="w-full resize-none rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 py-2 text-sm font-semibold text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[#C9964A]/30"
      />
      {result && (
        <p className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-[var(--fi-emerald)]' : 'text-red-600'}`}>
          {result.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
          {result.msg}
        </p>
      )}
      <Button
        size="sm"
        disabled={pending || !body}
        onClick={handleBroadcast}
        className="w-full bg-[#C9964A] font-semibold text-white hover:bg-[#A87A3A]"
      >
        {pending ? 'جاري الإرسال…' : 'بث الرسالة'}
      </Button>
    </div>
  )
}
