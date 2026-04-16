'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIAssistantChat() {
  const [phone, setPhone]           = useState('')
  const [input, setInput]           = useState('')
  const [messages, setMessages]     = useState<Message[]>([])
  const [loading, setLoading]       = useState(false)
  const [started, setStarted]       = useState(false)
  const bottomRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const start = () => {
    if (!phone.trim()) return
    setStarted(true)
    setMessages([{
      role: 'assistant',
      content: `أهلاً بك في FAST INVESTMENT! 👋\nيسعدنا مساعدتك في العثور على العقار المناسب.\nكيف يمكنني مساعدتك اليوم؟`
    }])
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/whatsapp-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          phone,
          conversationHistory: messages,
        }),
      })
      const data = await res.json() as { reply?: string; error?: string }
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply! }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ في الاتصال. حاول مجدداً.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!started) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Bot className="text-emerald-600" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">المساعد الذكي</h3>
            <p className="text-xs text-slate-500">مدعوم بـ Claude AI</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">أدخل رقم هاتف العميل لبدء محادثة تجريبية</p>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="01012345678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && start()}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
            dir="ltr"
          />
          <button
            onClick={start}
            disabled={!phone.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            ابدأ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Bot size={16} />
        </div>
        <div>
          <div className="font-bold text-sm">المساعد الذكي — FAST INVESTMENT</div>
          <div className="text-xs opacity-70" dir="ltr">{phone}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-blue-100' : 'bg-emerald-100'
            }`}>
              {msg.role === 'user' ? <User size={14} className="text-blue-600" /> : <Bot size={14} className="text-emerald-600" />}
            </div>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-bl-2xl rounded-tr-sm'
                : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-br-2xl rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
              <Bot size={14} className="text-emerald-600" />
            </div>
            <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm">
              <Loader2 size={16} className="text-emerald-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 flex gap-2 bg-white">
        <input
          type="text"
          placeholder="اكتب رسالتك..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading}
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
