import type { Metadata } from 'next'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters'
import PropertyGrid from '@/components/marketplace/PropertyGrid'
import { marketplacePackages, marketplaceSampleProperties } from '@/domains/marketplace/sample-data'
import { mapAdToMarketplaceProperty } from '@/domains/marketplace/queries'
import type { MarketplaceProperty, MarketplaceUser } from '@/domains/marketplace/types'
import { Building2, MessageCircle, ShieldCheck, Star, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'سوق العقارات | FAST INVESTMENT',
  description: 'تصفح عقارات للبيع والاستثمار في مصر بدون تسجيل، وتواصل بأمان عبر محادثة داخل النظام.',
}

export default async function MarketplacePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: ads, error: adsError }] = await Promise.all([
    user
      ? supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('ads')
      .select(`id,title,description,price,currency,property_type,location,area_sqm,bedrooms,bathrooms,images,is_featured,is_urgent,status,views_count,created_at,user_id`)
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(24),
  ])

  if (adsError) console.error('Marketplace ads query failed', adsError)

  const sellerIds = Array.from(new Set((ads ?? []).map((ad) => ad.user_id).filter(Boolean)))
  const { data: sellerProfiles } = sellerIds.length
    ? await supabase.from('profiles').select('id, full_name, company_name, account_type').in('id', sellerIds)
    : { data: [] }

  const sellerById = new Map((sellerProfiles ?? []).map((s) => [s.id, s]))

  const currentUser: MarketplaceUser | null = user
    ? { id: user.id, email: user.email ?? null, name: profile?.full_name ?? user.email ?? 'مستخدم', role: profile?.role ?? null }
    : null

  const properties: MarketplaceProperty[] = ads?.length
    ? ads.map((ad) => mapAdToMarketplaceProperty({ ...ad, seller_profile: sellerById.get(ad.user_id) ?? null }))
    : marketplaceSampleProperties

  const featuredCount = properties.filter((p) => p.featured).length
  const averagePrice = properties.length
    ? Math.round(properties.reduce((t, p) => t + p.price, 0) / properties.length)
    : 0

  return (
    <div className="min-h-screen bg-[var(--color-market-paper)] text-[var(--color-market-ink)]">
      <MarketplaceHeader user={currentUser} />

      <main>
        {/* Hero */}
        <section className="border-b border-[var(--color-market-line)] bg-[var(--color-market-sand)]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center lg:py-14">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-market-gold)]/40 bg-white/70 px-3 py-1 text-sm font-bold text-[var(--color-market-navy)]">
                <ShieldCheck className="size-3.5 text-[var(--color-market-teal)]" aria-hidden="true" />
                سوق عقاري موثق بإدارة FAST INVESTMENT
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight text-[var(--color-market-ink)] md:text-5xl">
                عقارات للبيع والاستثمار في مصر
                <span className="block text-[var(--color-market-teal)]">بدون إظهار أرقام الهاتف</span>
              </h1>

              <p className="max-w-2xl text-base font-medium leading-8 text-[#4B6175] md:text-lg">
                تصفح عقارات أولية وإعادة بيع، قارن المطورين والبائعين الموثقين، وابدأ محادثة آمنة داخل النظام.
              </p>

              {/* Stats */}
              <div className="grid max-w-xl grid-cols-3 gap-3 text-center">
                <Metric value={`${properties.length}+`} label="إعلان نشط" icon={Building2} />
                <Metric value={`${featuredCount}`} label="مميز" icon={Star} />
                <Metric value={formatCompactPrice(averagePrice)} label="متوسط السعر" icon={TrendingUp} />
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3 text-sm font-bold text-[var(--color-market-teal)]">
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-market-mist)] px-3 py-1">
                  <MessageCircle className="size-3.5" aria-hidden="true" /> تواصل آمن داخل النظام
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-market-mist)] px-3 py-1">
                  <ShieldCheck className="size-3.5" aria-hidden="true" /> مراجعة قبل النشر
                </span>
              </div>
            </div>

            {/* Hero image */}
            <div className="overflow-hidden rounded-2xl border border-[var(--color-market-line)] bg-white shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=80"
                alt="وحدة عقارية فاخرة في مصر"
                width={1100}
                height={825}
                priority
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="grid grid-cols-2 divide-x divide-x-reverse divide-[var(--color-market-line)] bg-white">
                <div className="p-4">
                  <p className="text-xs font-bold text-[var(--color-market-slate)]">نظام التواصل</p>
                  <p className="mt-1 text-base font-black text-[var(--color-market-teal)]">محادثة داخلية آمنة</p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold text-[var(--color-market-slate)]">ظهور الإعلانات</p>
                  <p className="mt-1 text-base font-black text-[var(--color-market-gold)]">بعد موافقة الفريق</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Listings */}
        <section className="mx-auto max-w-7xl px-4 py-8">
          <MarketplaceFilters />
          <PropertyGrid properties={properties} user={currentUser} />
        </section>

        {/* Packages */}
        <section className="border-y border-[var(--color-market-line)] bg-[var(--color-market-mist)]">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black text-[var(--color-market-teal)]">نظام النقاط والإعلانات</p>
                <h2 className="mt-2 text-3xl font-black text-[var(--color-market-ink)]">
                  باقات واضحة للأفراد والشركات
                </h2>
              </div>
              <p className="max-w-2xl text-sm font-medium leading-7 text-[var(--color-market-slate)]">
                كل فرد يحصل على إعلان مجاني واحد. الإعلانات الإضافية والظهور المميز تتم عبر نقاط ومحفظة مدفوعة.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {marketplacePackages.map((plan) => (
                <div
                  key={plan.id}
                  className="fi-card-hover rounded-xl border border-[var(--color-market-line)] bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-black text-[var(--color-market-navy)]">{plan.name}</p>
                  <p className="fi-tabular mt-3 text-2xl font-black text-[var(--color-market-ink)]">
                    {plan.price.toLocaleString('ar-EG')} ج.م
                  </p>
                  <div className="mt-4 space-y-2 text-sm font-medium text-[var(--color-market-slate)]">
                    <p>{plan.adsIncluded} إعلان</p>
                    <p>{plan.featuredAds} إعلان مميز</p>
                    {plan.verifiedBadge && (
                      <p className="flex items-center gap-1 text-[var(--color-market-teal)]">
                        <ShieldCheck className="size-3.5" aria-hidden="true" /> شارة موثق للشركات
                      </p>
                    )}
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

function Metric({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-[var(--color-market-line)] bg-white/80 p-3">
      <Icon className="mx-auto mb-1 size-4 text-[var(--color-market-teal)]" aria-hidden="true" />
      <p className="fi-tabular text-xl font-black text-[var(--color-market-navy)]">{value}</p>
      <p className="mt-0.5 text-xs font-bold text-[var(--color-market-slate)]">{label}</p>
    </div>
  )
}

function formatCompactPrice(value: number) {
  if (!value) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 1 })} م`
  return `${Math.round(value / 1_000).toLocaleString('ar-EG')} ألف`
}
