import type { Metadata } from 'next'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters'
import PropertyGrid from '@/components/marketplace/PropertyGrid'
import { marketplacePackages, marketplaceSampleProperties } from '@/domains/marketplace/sample-data'
import { mapAdToMarketplaceProperty } from '@/domains/marketplace/queries'
import type { MarketplaceProperty, MarketplaceUser } from '@/domains/marketplace/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'سوق العقارات | EHAB & ESLAM TEAM',
  description: 'تصفح عقارات للبيع والاستثمار في مصر بدون تسجيل، وتواصل بأمان عبر محادثة داخل النظام.',
}

export default async function MarketplacePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: ads }] = await Promise.all([
    user
      ? supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('ads')
      .select(`
        id,
        title,
        description,
        price,
        currency,
        property_type,
        location,
        area_sqm,
        bedrooms,
        bathrooms,
        images,
        is_featured,
        is_urgent,
        status,
        views_count,
        created_at,
        profiles:user_id(full_name, company_name, account_type)
      `)
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(24),
  ])

  const currentUser: MarketplaceUser | null = user
    ? {
        id: user.id,
        email: user.email ?? null,
        name: profile?.full_name ?? user.email ?? 'مستخدم',
        role: profile?.role ?? null,
      }
    : null

  const properties: MarketplaceProperty[] = ads?.length
    ? ads.map((ad) => mapAdToMarketplaceProperty(ad))
    : marketplaceSampleProperties

  const featuredCount = properties.filter((property) => property.featured).length
  const averagePrice = properties.length
    ? Math.round(properties.reduce((total, property) => total + property.price, 0) / properties.length)
    : 0

  return (
    <div className="min-h-screen bg-[#FBFCFA] text-[#102033]">
      <MarketplaceHeader user={currentUser} />

      <main>
        <section className="border-b border-[#DDE6E4] bg-[#F5EFE4]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center lg:py-12">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-[#C9964A]/40 bg-white/70 px-3 py-1 text-sm font-bold text-[#17375E]">
                سوق عقاري موثق بإدارة EHAB & ESLAM TEAM
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#102033] md:text-5xl">
                  عقارات للبيع والاستثمار في مصر بدون إظهار أرقام الهاتف
                </h1>
                <p className="max-w-2xl text-base font-medium leading-8 text-[#4B6175] md:text-lg">
                  تصفح عقارات أولية وإعادة بيع، قارن المطورين والبائعين الموثقين، وابدأ محادثة آمنة داخل النظام عند الاهتمام بأي وحدة.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center sm:max-w-xl">
                <Metric value={`${properties.length}+`} label="إعلان نشط" />
                <Metric value={`${featuredCount}`} label="إعلانات مميزة" />
                <Metric value={formatCompactPrice(averagePrice)} label="متوسط السعر" />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=80"
                alt="وحدة عقارية فاخرة في مصر"
                width={1100}
                height={825}
                priority
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="grid grid-cols-2 divide-x divide-x-reverse divide-[#DDE6E4] bg-white">
                <div className="p-4">
                  <p className="text-sm font-bold text-[#64748B]">نظام التواصل</p>
                  <p className="mt-1 text-lg font-black text-[#0F8F83]">محادثة داخلية آمنة</p>
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold text-[#64748B]">ظهور الإعلانات</p>
                  <p className="mt-1 text-lg font-black text-[#C9964A]">بعد موافقة الفريق</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8">
          <MarketplaceFilters />
          <PropertyGrid properties={properties} user={currentUser} />
        </section>

        <section className="border-y border-[#DDE6E4] bg-[#EEF6F5]">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black text-[#0F8F83]">نظام النقاط والإعلانات</p>
                <h2 className="mt-2 text-3xl font-black text-[#102033]">باقات واضحة للأفراد والشركات</h2>
              </div>
              <p className="max-w-2xl text-sm font-semibold leading-7 text-[#64748B]">
                كل فرد يحصل على إعلان مجاني واحد. الإعلانات الإضافية والظهور المميز تتم عبر نقاط ومحفظة مدفوعة قابلة للمراجعة المالية.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {marketplacePackages.map((plan) => (
                <div key={plan.id} className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm">
                  <p className="text-sm font-black text-[#17375E]">{plan.name}</p>
                  <p className="mt-3 text-2xl font-black text-[#102033]">{plan.price.toLocaleString('ar-EG')} ج.م</p>
                  <div className="mt-4 space-y-2 text-sm font-semibold text-[#64748B]">
                    <p>{plan.adsIncluded} إعلان</p>
                    <p>{plan.featuredAds} إعلان مميز</p>
                    {plan.verifiedBadge && <p className="text-[#0F8F83]">شارة موثق للشركات</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-[#DDE6E4] bg-white/80 p-3">
      <p className="text-xl font-black text-[#17375E]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[#64748B]">{label}</p>
    </div>
  )
}

function formatCompactPrice(value: number) {
  if (!value) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 1 })} م`
  return `${Math.round(value / 1_000).toLocaleString('ar-EG')} ألف`
}
