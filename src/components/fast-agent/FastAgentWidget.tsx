'use client'

import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Bot, Loader2, Maximize2, MessageSquareText, Minimize2, Send, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type FastMessage = {
  role: 'user' | 'assistant'
  content: string
}

type FastResponse = {
  reply: string
  mode: 'ai' | 'fallback'
  role: string
  tools: string[]
  conversationId: string | null
}

const welcomeMessage: FastMessage = {
  role: 'assistant',
  content: 'أنا FAST، مستشارك الذكي داخل النظام. اسألني عن العقارات، العملاء، الصفقات، الشركاء، التقارير، أو خطوات استخدام المنصة.',
}

export default function FastAgentWidget() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<FastMessage[]>([welcomeMessage])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [meta, setMeta] = useState<Pick<FastResponse, 'mode' | 'role' | 'tools'> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const visibleMessages = useMemo(() => messages.slice(-10), [messages])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: FastMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/fast-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, conversationId }),
      })
      const payload = await response.json() as FastResponse
      setMessages((current) => [...current, { role: 'assistant', content: payload.reply }])
      setConversationId(payload.conversationId ?? conversationId)
      setMeta({ mode: payload.mode, role: payload.role, tools: payload.tools })
    } catch (error) {
      console.error('FAST widget failed', error)
      setMessages((current) => [...current, {
        role: 'assistant',
        content: 'تعذر الاتصال بوكيل FAST الآن. حاول مرة أخرى بعد لحظات.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-toast font-cairo" dir="rtl">
      {open && (
        <section
          className={`mb-3 overflow-hidden rounded-3xl border border-market-line bg-white shadow-[0_24px_80px_rgba(16,32,51,0.20)] transition-all ${
            expanded ? 'h-[78vh] w-[min(720px,calc(100vw-2rem))]' : 'h-[560px] w-[min(420px,calc(100vw-2rem))]'
          }`}
          aria-label="FAST AI Agent"
        >
          <header className="flex items-center justify-between gap-3 border-b border-market-line bg-[#0D1B2E] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10">
                <Bot className="size-5 text-[#E8C488]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">FAST AI Agent</p>
                <p className="truncate text-xs font-semibold text-white/62">مستشار سياقي مرتبط بالصلاحيات</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-xl text-white hover:bg-white/10 hover:text-white"
                onClick={() => setExpanded((current) => !current)}
                aria-label={expanded ? 'تصغير FAST' : 'تكبير FAST'}
              >
                {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-xl text-white hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="إغلاق FAST"
              >
                <X className="size-4" />
              </Button>
            </div>
          </header>

          <div className="flex h-[calc(100%-65px)] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#F5F8F6] p-4">
              {visibleMessages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm font-semibold leading-7 ${
                    message.role === 'user'
                      ? 'mr-auto bg-market-navy text-white'
                      : 'ml-auto border border-market-line bg-white text-market-ink'
                  }`}
                >
                  {renderMessage(message.content)}
                </article>
              ))}
              {loading && (
                <div className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-market-line bg-white px-4 py-3 text-sm font-bold text-market-slate">
                  <Loader2 className="size-4 animate-spin text-market-teal" />
                  FAST يفكر...
                </div>
              )}
            </div>

            <div className="border-t border-market-line bg-white p-3">
              {meta && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-black text-market-slate">
                  <span className="inline-flex items-center gap-1 rounded-full bg-market-mist px-2 py-1 text-market-teal">
                    <ShieldCheck className="size-3" />
                    {meta.role}
                  </span>
                  <span className="rounded-full bg-market-paper px-2 py-1">
                    {meta.mode === 'ai' ? 'AI' : 'Fallback'}
                  </span>
                  {meta.tools.slice(0, 2).map((tool) => (
                    <span key={tool} className="rounded-full bg-market-paper px-2 py-1">{tool}</span>
                  ))}
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="grid gap-2">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      formRef.current?.requestSubmit()
                    }
                  }}
                  placeholder="اكتب سؤالك لـ FAST..."
                  className="max-h-32 min-h-20 resize-none rounded-2xl border-market-line bg-market-paper text-sm font-semibold"
                />
                <Button type="submit" disabled={loading || !input.trim()} className="rounded-2xl bg-market-teal text-white hover:bg-[#0B6F66]">
                  {loading ? <Loader2 className="ms-2 size-4 animate-spin" /> : <Send className="ms-2 size-4" />}
                  إرسال
                </Button>
              </form>
            </div>
          </div>
        </section>
      )}

      <Button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="h-14 rounded-2xl bg-[#0D1B2E] px-5 text-white shadow-[0_18px_50px_rgba(16,32,51,0.22)] hover:bg-market-ink"
        aria-expanded={open}
      >
        <MessageSquareText className="ms-2 size-5 text-[#E8C488]" />
        FAST
      </Button>
    </div>
  )
}

function renderMessage(content: string) {
  return content.split('\n').filter(Boolean).map((line, index) => (
    <p key={`${line}-${index}`} className="mb-1 last:mb-0">
      {line}
    </p>
  ))
}
