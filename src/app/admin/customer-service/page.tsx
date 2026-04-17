import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Headphones, MessageCircle, Send, Smartphone } from 'lucide-react'

const conversations = [
  { name: 'مشتري مهتم', channel: 'Internal Chat', subject: 'استفسار عن شقة التجمع', sla: '2 د' },
  { name: 'شركة عقارية', channel: 'WhatsApp Business', subject: 'مراجعة باقة الشركات', sla: '8 د' },
  { name: 'مالك فردي', channel: 'Internal Chat', subject: 'سبب رفض الإعلان', sla: '14 د' },
]

export default function CustomerServicePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[#0F8F83]">Customer Service Team</p>
        <h1 className="mt-2 text-3xl font-black text-[#102033] dark:text-white">مركز خدمة العملاء الموحد</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">إدارة محادثات النظام وتجهيز قناة WhatsApp Business API ضمن نفس شاشة التشغيل.</p>
      </div>

      <div className="grid min-h-[560px] overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm dark:bg-slate-900 lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-[#DDE6E4] bg-[#EEF6F5] p-4 dark:bg-slate-800 lg:border-b-0 lg:border-l">
          <p className="mb-4 flex items-center gap-2 font-black">
            <Headphones className="size-5 text-[#0F8F83]" />
            قائمة الانتظار
          </p>
          {conversations.map((conversation) => (
            <div key={conversation.subject} className="mb-3 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <p className="font-black">{conversation.name}</p>
                <Badge className="bg-[#C9964A]/10 text-[#C9964A]">{conversation.sla}</Badge>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">{conversation.subject}</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[#0F8F83]">
                {conversation.channel === 'WhatsApp Business' ? <Smartphone className="size-3" /> : <MessageCircle className="size-3" />}
                {conversation.channel}
              </p>
            </div>
          ))}
        </aside>

        <section className="flex flex-col">
          <div className="border-b border-[#DDE6E4] p-4">
            <p className="font-black">استفسار عن شقة التجمع</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">قناة داخلية · العميل لا يرى رقم البائع</p>
          </div>
          <div className="flex-1 space-y-3 p-4">
            <Bubble mine={false} text="هل يمكنني معرفة تفاصيل المعاينة؟" />
            <Bubble mine text="أكيد، سننسق ميعاد مناسب ونرسل التفاصيل داخل المحادثة." />
            <Bubble mine={false} text="هل يوجد خصم للكاش؟" />
          </div>
          <div className="border-t border-[#DDE6E4] p-4">
            <div className="flex gap-2">
              <input className="min-h-10 flex-1 rounded-lg border border-[#DDE6E4] px-3 text-sm font-semibold outline-none focus:ring-3 focus:ring-[#0F8F83]/20" placeholder="اكتب رد خدمة العملاء..." />
              <Button className="bg-[#0F8F83] text-white hover:bg-[#0B6F66]">
                <Send className="ms-1 size-4" />
                إرسال
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Bubble({ text, mine }: { text: string; mine: boolean }) {
  return (
    <div className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
      <p className={`max-w-lg rounded-lg px-4 py-3 text-sm font-semibold leading-6 ${mine ? 'bg-[#17375E] text-white' : 'bg-[#EEF6F5] text-[#102033]'}`}>
        {text}
      </p>
    </div>
  )
}
