import type { Metadata } from 'next'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import { MarketplaceTicker } from '@/components/marketplace/MarketplaceTicker'
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters'
import PropertyGrid from '@/components/marketplace/PropertyGrid'
import { marketplacePackages, marketplaceSampleProperties } from '@/domains/marketplace/sample-data'
import { mapAdToMarketplaceProperty } from '@/domains/marketplace/queries'
import type { MarketplaceProperty, MarketplaceUser } from '@/domains/marketplace/types'
import { Building2, CheckCircle2, MessageCircle, ShieldCheck, Sparkles, Star, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Real Estate Marketplace | FAST INVESTMENT',
  description: 'Browse premium properties for sale and investment in Egypt. Connect securely with verified sellers through our trusted in-platform messaging.',
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
      .select('id,title,description,price,currency,property_type,location,area_sqm,bedrooms,bathrooms,images,is_featured,is_urgent,listing_type,status,views_count,created_at,user_id')
      .eq('status', 'approved')
      .order('listing_type', { ascending: false })
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
    ? { id: user.id, email: user.email ?? null, name: profile?.full_name ?? user.email ?? 'User', role: profile?.role ?? null }
    : null

  const properties: MarketplaceProperty[] = ads?.length
    ? ads.map((ad) => mapAdToMarketplaceProperty({ ...ad, seller_profile: sellerById.get(ad.user_id) ?? null }))
    : marketplaceSampleProperties

  const featuredCount = properties.filter((p) => p.featured).length
  const averagePrice = properties.length
    ? Math.round(properties.reduce((t, p) => t + p.price, 0) / properties.length)
    : 0

  return (
    <div className="min-h-screen bg-[#f5f8ff] text-slate-900" dir="ltr">
      <MarketplaceHeader user={currentUser} />
      <MarketplaceTicker />

      <main>
        {/* ── Hero Section ──────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-slate-200/80">
          {/* Background gradient */}
          {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: `
                radial-gradient(ellipse at 8% 0%, rgba(37,99,235,0.10) 0%, transparent 50%),
                radial-gradient(ellipse at 92% 100%, rgba(16,185,129,0.08) 0%, transparent 45%),
                linear-gradient(180deg, #f0f6ff 0%, #f5f8ff 100%)
              `,
            }}
          />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:items-center lg:py-16">
            {/* Left — hero copy */}
            <div className="space-y-7">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-xs font-black text-blue-700 shadow-sm">
                <span
                  className="size-2 rounded-full"
                  // eslint-disable-next-line no-inline-styles/no-inline-styles
                  style={{ background: 'linear-gradient(135deg, #10b981, #2563eb)' }}
                />
                Verified Real Estate · Managed by FAST INVESTMENT
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-[1.1] text-slate-900 md:text-5xl lg:text-6xl">
                Premium Properties
                <span
                  className="block bg-clip-text text-transparent"
                  // eslint-disable-next-line no-inline-styles/no-inline-styles
                  style={{ backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #10b981 100%)' }}
                >
                  for Sale &amp; Investment
                </span>
              </h1>

              <p className="max-w-lg text-base font-semibold leading-8 text-slate-500 md:text-lg">
                Browse primary and resale units, compare verified developers and sellers,
                and start a secure conversation — all within one trusted platform.
              </p>

              {/* Stat cards */}
              <div className="grid max-w-lg grid-cols-3 gap-3 text-center">
                <MetricCard value={`${properties.length}+`} label="Active Listings" icon={Building2} />
                <MetricCard value={`${featuredCount}`} label="Featured Units" icon={Star} />
                <MetricCard value={formatCompactPrice(averagePrice)} label="Avg. Price" icon={TrendingUp} />
              </div>

              {/* Trust chips */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: MessageCircle, text: 'Secure in-platform chat' },
                  { icon: ShieldCheck, text: 'Reviewed before publishing' },
                  { icon: CheckCircle2, text: 'Verified sellers only' },
                ].map(({ icon: Icon, text }) => (
                  <span
                    key={text}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-black text-slate-600 shadow-sm"
                  >
                    <Icon className="size-3.5 text-blue-600" />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — hero image */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
              <Image
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=80"
                alt="Premium real estate in Egypt"
                width={1100}
                height={825}
                priority
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="grid grid-cols-2 divide-x divide-slate-100 bg-white">
                <div className="p-4">
                  <p className="text-xs font-bold text-slate-400">Communication</p>
                  <p className="mt-1 text-sm font-black text-blue-700">Secure Internal Chat</p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold text-slate-400">Listing Visibility</p>
                  <p className="mt-1 text-sm font-black text-emerald-700">Team-Reviewed &amp; Approved</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Listings Grid ─────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <MarketplaceFilters />
          <PropertyGrid properties={properties} user={currentUser} />
        </section>

        {/* ── Packages Section ──────────────────────────────── */}
        <section id="developers" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12">
            {/* Section header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                  <Sparkles className="size-3.5" />
                  Points &amp; Advertising Packages
                </div>
                <h2 className="text-3xl font-black text-slate-900">
                  Transparent Plans for Individuals &amp; Companies
                </h2>
              </div>
              <p className="max-w-sm text-sm font-semibold leading-7 text-slate-500">
                Every user gets one free listing. Additional ads and featured placement are powered by our secure points wallet.
              </p>
            </div>

            {/* Package cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {marketplacePackages.map((plan, i) => (
                <div
                  key={plan.id}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  style={i === 2 ? { borderColor: '#2563eb', boxShadow: '0 8px 32px rgba(37,99,235,0.12)' } : {}}
                >
                  {i === 2 && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black text-white">
                      MOST POPULAR
                    </span>
                  )}
                  <p className="text-sm font-black text-slate-900">{plan.name}</p>
                  <p className="fi-tabular mt-3 text-2xl font-black text-blue-700">
                    {plan.price.toLocaleString('en-US')} <span className="text-sm font-bold text-slate-400">EGP</span>
                  </p>
                  <div className="mt-4 space-y-2 text-xs font-bold text-slate-500">
                    <p className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" />{plan.adsIncluded} listing{plan.adsIncluded !== 1 ? 's' : ''}</p>
                    <p className="flex items-center gap-1.5"><Star className="size-3.5 text-amber-500" />{plan.featuredAds} featured ad{plan.featuredAds !== 1 ? 's' : ''}</p>
                    {plan.verifiedBadge && (
                      <p className="flex items-center gap-1.5 text-blue-600">
                        <ShieldCheck className="size-3.5" /> Verified badge
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

function MetricCard({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
      <Icon className="mx-auto mb-2 size-5 text-blue-600" />
      <p className="fi-tabular text-xl font-black text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold text-slate-400">{label}</p>
    </div>
  )
}

function formatCompactPrice(value: number) {
  if (!value) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  return `${Math.round(value / 1_000)}K`
}
