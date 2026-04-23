import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import { createServerClient } from '@/lib/supabase/server'
import type { MarketplaceUser } from '@/domains/marketplace/types'
import { MessageCircle, Send, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MarketplaceChatPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUser: MarketplaceUser | null = user
    ? { id: user.id, email: user.email ?? null, name: user.email ?? 'مستخدم', role: null }
    : null

  return (
    <div className="min-h-screen bg-[#FBFCFA] text-[#102033]">
      <MarketplaceHeader user={currentUser} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-black text-[#0F8F83]">مركز المحادثات</p>
          <h1 className="mt-2 text-4xl font-black">التواصل الداخلي للعقارات</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#64748B]">
            هذه واجهة أولية لمحادثات المشتري والبائع. الربط الفعلي يستخدم React Query و Supabase Realtime عبر `useChatMessages`.
          </p>
        </div>

        <div className="grid min-h-[560px] overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm lg:grid-cols-[320px_1fr]">
          <aside className="border-b border-[#DDE6E4] bg-[#EEF6F5] p-4 lg:border-b-0 lg:border-l">
            <p className="mb-4 flex items-center gap-2 font-black">
              <MessageCircle className="size-4 text-[#0F8F83]" />
              المحادثات النشطة
            </p>
            {['شقة التجمع الخامس', 'فيلا الشروق', 'تاون هاوس زايد'].map((thread, index) => (
              <div key={thread} className="mb-2 rounded-lg bg-white p-3">
                <p className="font-black">{thread}</p>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">{index === 0 ? 'رسالة جديدة منذ 5 دقائق' : 'بانتظار رد العميل'}</p>
              </div>
            ))}
          </aside>

          <section className="flex flex-col">
            <div className="border-b border-[#DDE6E4] p-4">
              <p className="flex items-center gap-2 font-black">
                <ShieldCheck className="size-4 text-[#0F8F83]" />
                محادثة آمنة بدون مشاركة رقم الهاتف
              </p>
            </div>
            <div className="flex-1 space-y-3 p-4">
              <Bubble mine={false} text="مرحباً، هل الوحدة متاحة للمعاينة هذا الأسبوع؟" />
              <Bubble mine text="نعم، يمكن تنسيق ميعاد عبر الفريق بدون تبادل أرقام." />
              <Bubble mine={false} text="ممتاز، أريد معرفة خطة السداد والموقع بدقة." />
            </div>
            <div className="border-t border-[#DDE6E4] p-4">
              <div className="flex gap-2">
                <input
                  aria-label="رسالة"
                  className="min-h-10 flex-1 rounded-lg border border-[#DDE6E4] px-3 text-sm font-semibold outline-none focus:ring-3 focus:ring-[#0F8F83]/20"
                  placeholder="اكتب رسالتك..."
                />
                <button className="inline-flex size-10 items-center justify-center rounded-lg bg-[#0F8F83] text-white">
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function Bubble({ text, mine }: { text: string; mine: boolean }) {
  return (
    <div className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
      <p className={`max-w-md rounded-lg px-4 py-3 text-sm font-semibold leading-6 ${mine ? 'bg-[#17375E] text-white' : 'bg-[#EEF6F5] text-[#102033]'}`}>
        {text}
      </p>
    </div>
  )
}
