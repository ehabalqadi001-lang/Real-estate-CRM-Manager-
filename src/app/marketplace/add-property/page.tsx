import { redirect } from 'next/navigation'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createServerClient } from '@/lib/supabase/server'
import { marketplacePackages } from '@/domains/marketplace/sample-data'
import type { MarketplaceUser } from '@/domains/marketplace/types'
import { submitPropertyAction } from './actions'
import { Camera, Coins, FileCheck2, ShieldCheck } from 'lucide-react'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  const currentUser: MarketplaceUser = {
    id: user.id,
    email: user.email ?? null,
    name: profile?.full_name ?? user.email ?? 'مستخدم',
    role: profile?.role ?? null,
  }

  return (
    <div className="min-h-screen bg-[#FBFCFA] text-[#102033]">
      <MarketplaceHeader user={currentUser} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <p className="text-sm font-black text-[#0F8F83]">إضافة عقار</p>
            <h1 className="mt-2 text-4xl font-black">أرسل إعلانك للمراجعة</h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-8 text-[#64748B]">
              كل إعلان جديد يدخل بحالة pending ولا يظهر في السوق إلا بعد موافقة فريق مراجعة الإعلانات. أرقام الهاتف لا تظهر للمشترين، والتواصل يتم عبر المحادثة الداخلية فقط.
            </p>
          </section>
          <aside className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-black text-[#17375E]">
              <Coins className="size-4 text-[#C9964A]" />
              محفظة النقاط
            </p>
            <p className="mt-3 text-3xl font-black">إعلان مجاني واحد</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">
              بعد الإعلان المجاني، يتم خصم نقاط من الرصيد حسب الباقة المختارة.
            </p>
          </aside>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <form action={submitPropertyAction} className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
            {feedback.submitted && (
              <div className="mb-4 rounded-lg border border-[#0F8F83]/25 bg-[#EEF6F5] p-3 text-sm font-black text-[#0F8F83]">
                تم إرسال الإعلان للمراجعة. لن يظهر في السوق قبل الموافقة اليدوية.
              </div>
            )}
            {feedback.error && (
              <div className="mb-4 rounded-lg border border-[#B54747]/25 bg-[#B54747]/10 p-3 text-sm font-black text-[#B54747]">
                {decodeURIComponent(feedback.error)}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="عنوان الإعلان" name="title" placeholder="مثال: شقة متشطبة في التجمع الخامس" />
              <Field label="نوع العقار" name="property_type" placeholder="شقة، فيلا، تاون هاوس" />
              <Field label="السعر بالجنيه" name="price" placeholder="3850000" />
              <Field label="المساحة بالمتر" name="area_sqm" placeholder="156" />
              <Field label="المدينة" name="city" placeholder="القاهرة الجديدة" />
              <Field label="المنطقة" name="district" placeholder="التجمع الخامس" />
              <Field label="عدد الغرف" name="bedrooms" placeholder="3" />
              <Field label="عدد الحمامات" name="bathrooms" placeholder="2" />
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="اكتب أهم مميزات الوحدة، التشطيب، الاستلام، والخدمات القريبة..."
                className="w-full resize-none rounded-lg border border-[#DDE6E4] bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-3 focus:ring-[#0F8F83]/20"
              />
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-[#DDE6E4] bg-[#FBFCFA] p-5 text-center">
              <Camera className="mx-auto size-8 text-[#17375E]" />
              <p className="mt-2 font-black">صور العقار ومستندات الملكية</p>
              <p className="mt-1 text-sm font-semibold text-[#64748B]">واجهة مرفقات جاهزة للربط مع Supabase Storage.</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="bg-[#17375E] text-white hover:bg-[#102033]">
                <FileCheck2 className="ms-1 size-4" />
                إرسال للمراجعة
              </Button>
              <Button type="button" variant="outline" className="border-[#DDE6E4]">
                حفظ كمسودة
              </Button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-[#0F8F83]">
                <ShieldCheck className="size-4" />
                قواعد الخصوصية
              </p>
              <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-[#64748B]">
                <li>لا يتم عرض رقم الهاتف في صفحة الإعلان.</li>
                <li>لا يظهر الإعلان قبل موافقة فريق المراجعة.</li>
                <li>كل محادثة مرتبطة بإعلان محدد داخل النظام.</li>
              </ul>
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

function Field({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder={placeholder} className="h-10 border-[#DDE6E4]" />
    </div>
  )
}
