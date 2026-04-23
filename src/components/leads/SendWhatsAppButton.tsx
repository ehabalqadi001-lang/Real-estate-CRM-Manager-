'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { logWhatsAppSend } from '@/app/dashboard/leads/actions'

interface Props {
  leadId: string
  phone: string
  leadName: string
}

const TEMPLATES = [
  {
    label: 'تحية ترحيبية',
    body: (name: string) => `أهلاً بك أستاذ ${name}،\nنسعد بتواصلنا معك ونرحب بك في FAST INVESTMENT.\nكيف يمكننا مساعدتك اليوم؟`,
  },
  {
    label: 'متابعة عرض',
    body: (name: string) => `مرحباً أستاذ ${name}،\nأردنا فقط المتابعة معك بخصوص العرض الذي تحدثنا عنه.\nهل لديك أي استفسارات؟`,
  },
  {
    label: 'تأكيد موعد',
    body: (name: string) => `أستاذ ${name}،\nنذكركم بموعد الزيارة الميدانية المحددة لكم.\nنرحب بكم وسنكون بانتظاركم.`,
  },
]

export default function SendWhatsAppButton({ leadId, phone, leadName }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(0)
  const [sending, setSending] = useState(false)

  const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '20')
  const message = TEMPLATES[selected].body(leadName)

  async function handleSend() {
    setSending(true)
    await logWhatsAppSend(leadId, phone, message)
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
    setSending(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-[#25D366] hover:bg-[#1ab854] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
      >
        <MessageCircle size={15} /> واتساب
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <MessageCircle className="text-[#25D366]" size={20} /> إرسال واتساب
            </h3>

            <div className="space-y-1.5">
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    selected === i ? 'bg-[#25D366]/10 border-[#25D366] text-[#1ab854]' : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 font-medium whitespace-pre-wrap border border-slate-100">
              {message}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-[#25D366] hover:bg-[#1ab854] disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                {sending ? 'جاري الفتح...' : 'فتح واتساب وإرسال'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
