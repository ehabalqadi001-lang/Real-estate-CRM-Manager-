import { redirect } from 'next/navigation'
import { Coins, ShieldCheck, Sparkles } from 'lucide-react'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import ListingForm from '@/components/marketplace/listing-form/ListingForm'
import { createServerClient } from '@/lib/supabase/server'
import { marketplacePackages } from '@/domains/marketplace/sample-data'
import type { MarketplaceUser } from '@/domains/marketplace/types'

export const dynamic = 'force-dynamic'

export default async function AddPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>
}) {
  const feedback = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, projectsResult, developersResult, walletResult, costResult] = await Promise.all([
    supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle(),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('developers').select('id, name').order('name'),
    supabase.from('user_wallets').select('points_balance').eq('user_id', user.id).maybeSingle(),
    supabase.from('ad_cost_config').select('regular_points_cost, premium_points_cost').eq('id', true).maybeSingle(),
  ])

  const currentUser: MarketplaceUser = {
    id: user.id,
    email: user.email ?? null,
    name: profileResult.data?.full_name ?? user.email ?? 'عميل',
    role: profileResult.data?.role ?? 'CLIENT',
  }

  return (
    <div className="min-h-screen bg-[#FBFCFA] text-[#102033]" dir="rtl">
      <MarketplaceHeader user={currentUser} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <p className="text-sm font-black text-[#0F8F83]">إضافة وحدة عقارية</p>
            <h1 className="mt-2 text-4xl font-black">محرك إدراج وحدات FAST INVESTMENT</h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-8 text-[#64748B]">
              أضف بيانات وحدتك في نموذج متعدد الخطوات. كل إعلان يدخل حالة المراجعة أولا، ولا تظهر أرقام الهاتف للعامة؛ التواصل يتم عبر محادثة داخل النظام لحماية العميل والمشتري.
            </p>
          </section>
          <aside className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-black text-[#17375E]">
              <Coins className="size-4 text-[#C9964A]" />
              محفظة الإعلانات
            </p>
            <p className="mt-3 text-3xl font-black">{Number(walletResult.data?.points_balance ?? 0).toLocaleString()} pts</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">
              Regular: {Number(costResult.data?.regular_points_cost ?? 10).toLocaleString()} pts · Premium: {Number(costResult.data?.premium_points_cost ?? 50).toLocaleString()} pts
            </p>
          </aside>
        </div>

        {feedback.submitted && (
          <div className="mb-6 rounded-lg border border-[#0F8F83]/25 bg-[#EEF6F5] p-4 text-sm font-black text-[#0F8F83]">
            تم إرسال الإعلان للمراجعة بنجاح. لن يظهر في السوق قبل الموافقة اليدوية.
          </div>
        )}
        {feedback.error && (
          <div className="mb-6 rounded-lg border border-[#B54747]/25 bg-[#B54747]/10 p-4 text-sm font-black text-[#B54747]">
            {decodeURIComponent(feedback.error)}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <ListingForm
            userId={user.id}
            projects={projectsResult.data ?? []}
            developers={developersResult.data ?? []}
          />

          <aside className="space-y-4">
            <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-[#0F8F83]">
                <ShieldCheck className="size-4" />
                قواعد الخصوصية
              </p>
              <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-[#64748B]">
                <li>لا يتم عرض رقم الهاتف في صفحة الإعلان.</li>
                <li>لا يظهر الإعلان قبل موافقة فريق المراجعة.</li>
                <li>الصور العامة منفصلة عن المستندات الخاصة.</li>
                <li>المستندات الهندسية والعقود محفوظة في مسارات خاصة.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-[#C9964A]/30 bg-[#FFF8EC] p-4">
              <p className="flex items-center gap-2 text-sm font-black text-[#C9964A]">
                <Sparkles className="size-4" />
                Gemini Marketing
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#64748B]">
                زر إنشاء المحتوى يعمل بعد تعبئة تفاصيل الوحدة، ويولد وصفا عربيا قابلا للتعديل قبل الإرسال.
              </p>
            </div>

            <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-[#17375E]">الباقات المتاحة</p>
              <div className="mt-3 space-y-3">
                {marketplacePackages.map((plan) => (
                  <div key={plan.id} className="rounded-lg bg-[#EEF6F5] p-3">
                    <p className="font-black">{plan.name}</p>
                    <p className="mt-1 text-sm font-semibold text-[#64748B]">
                      {plan.adsIncluded} إعلان / {plan.price.toLocaleString('ar-EG')} ج.م
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
