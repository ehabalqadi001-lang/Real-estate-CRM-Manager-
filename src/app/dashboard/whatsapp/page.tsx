'use client'
import { useI18n } from '@/hooks/use-i18n'

import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/shared/supabase/browser'
import AIAssistantChat from '@/components/whatsapp/AIAssistantChat'

interface WhatsAppLog {
  id: string
  sent_at: string
  client_phone: string
  message_body: string
  status: string
}

const TEMPLATES = [
  {
    id: 1,
    title: 'تأكيد الحجز',
    trigger: 'عند تحويل الصفقة إلى "حجز"',
    variant: 'blue' as const,
    body: `أهلاً بك أستاذ [اسم_العميل] ✨\n\nنهنئك! تم تأكيد حجز وحدتك بنجاح في مشروع [اسم_الكومباوند] مع المطور [اسم_المطور].\n\nإجمالي القيمة: [قيمة_الوحدة] جنيه.\nالمقدم المدفوع: [المقدم_المدفوع] جنيه.\n\nيسعدنا انضمامك لعائلة FAST INVESTMENT.`,
  },
  {
    id: 2,
    title: 'تذكير القسط',
    trigger: 'قبل 3 أيام من الاستحقاق',
    variant: 'blue' as const,
    body: `عزيزي [اسم_العميل] 📅\n\nتذكير ودي بأن قسط وحدتك في [اسم_الكومباوند] يحل موعده بتاريخ [تاريخ_الاستحقاق].\n\nقيمة القسط: [قيمة_القسط] جنيه.\nالرصيد المتبقي: [الرصيد_المتبقي] جنيه.`,
  },
  {
    id: 3,
    title: 'مطالبة متأخرات',
    trigger: 'بعد 48 ساعة من الاستحقاق',
    variant: 'red' as const,
    body: `أستاذ [اسم_العميل] المحترم ⚠️\n\nيوجد قسط متأخر السداد على وحدتكم في [اسم_الكومباوند].\n\nتاريخ الاستحقاق: [تاريخ_الاستحقاق]\nالمبلغ المتأخر: [قيمة_القسط] جنيه.\n\nنرجو سرعة السداد تجنباً لغرامات التأخير.`,
  },
  {
    id: 4,
    title: 'تهنئة التسليم',
    trigger: 'عند تحويل الصفقة إلى "تسليم"',
    variant: 'green' as const,
    body: `ألف مبروك أستاذ [اسم_العميل]! 🎉🔑\n\nيُسعدنا تهنئتكم بوصول وحدتكم في [اسم_الكومباوند] لمرحلة التسليم النهائي.\n\nنتمنى لكم أوقاتاً سعيدة في عقاركم الجديد.`,
  },
]

const VARIANT_STYLES = {
  blue:  { border: 'border-r-4 border-r-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  red:   { border: 'border-r-4 border-r-red-500',    badge: 'bg-red-50 text-red-700 border-red-200' },
  green: { border: 'border-r-4 border-r-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

function highlightVars(text: string) {
  const { dir } = useI18n()
  return text.split(/(\[.*?\])/g).map((part, i) => {
    if (!part.startsWith('[')) return <span key={i}>{part}</span>
    const isMoney = /قيمة|مبلغ|رصيد|مقدم|قسط/.test(part)
    return (
      <span key={i}
        className={`font-bold px-1 py-0.5 rounded text-xs ${isMoney ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
        {part}
      </span>
    )
  })
}

export default function WhatsAppHub() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([])
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true })

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    let mounted = true
    supabase.from('whatsapp_logs').select('*').order('sent_at', { ascending: false }).limit(15)
      .then(({ data }) => { if (mounted && data) { setLogs(data); setLoading(false) } })
    return () => { mounted = false }
  }, [])

  const statusIcon = (s: string) => {
    if (s === 'delivered') return <CheckCircle2 size={13} className="text-emerald-500" />
    if (s === 'sent')      return <CheckCircle2 size={13} className="text-blue-400" />
    return <AlertCircle size={13} className="text-red-400" />
  }

  const statusLabel = (s: string) => ({
    delivered: 'تم الاستلام', sent: 'أُرسلت', failed: 'فشل الإرسال',
  })[s] ?? s

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-lg shadow-[#25D366]/20">
            <MessageSquare size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">مركز واتساب الأتمتة</h1>
            <p className="text-xs text-slate-400">WhatsApp Business API — قوالب الإرسال التلقائي</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Gateway: متصل
        </div>
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map(tpl => {
          const styles = VARIANT_STYLES[tpl.variant]
          return (
            <div key={tpl.id} className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm ${styles.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">{tpl.id}. {tpl.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> {tpl.trigger}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setEnabled(e => ({ ...e, [tpl.id]: !e[tpl.id] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${enabled[tpl.id] ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled[tpl.id] ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{enabled[tpl.id] ? 'مفعل' : 'معطل'}</span>
                </label>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                {highlightVars(tpl.body)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Zap size={15} className="text-amber-500" />
          <h2 className="font-black text-slate-800 text-sm">سجل الرسائل الصادرة</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['الوقت', 'هاتف العميل', 'نوع الرسالة', 'الحالة'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">جاري التحميل...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">لا يوجد نشاط إرسال حتى الآن.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs text-slate-500" dir="ltr">
                    {new Date(log.sent_at).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-blue-600" dir="ltr">{log.client_phone}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {log.message_body.includes('متأخر') ? 'مطالبة متأخرات'
                      : log.message_body.includes('مبروك') ? 'تهنئة تسليم'
                      : 'تذكير / حجز'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs font-bold">
                      {statusIcon(log.status)} {statusLabel(log.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
          🤖 المساعد الذكي — محادثة تجريبية مع عميل
        </h2>
        <AIAssistantChat />
      </div>

    </div>
  )
}
