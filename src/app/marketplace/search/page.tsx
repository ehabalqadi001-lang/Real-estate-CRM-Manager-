import Link from 'next/link'
import type { ReactNode } from 'react'
import { Bath, BedDouble, Building2, MapPin, Search, TrendingUp } from 'lucide-react'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import nextDynamic from 'next/dynamic'

const MarketplaceMap = nextDynamic(() => import('@/components/marketplace/MarketplaceMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse rounded-lg bg-[var(--fi-soft)]" />
})

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  type?: string
  city?: string
  max?: string
}

type MarketplaceProperty = {
  id: string
  title_ar: string
  city: string
  district: string | null
  property_type: string
  unit_type: string | null
  area_sqm: number | null
  bedrooms: number | null
  bathrooms: number | null
  list_price: number
  down_payment: number | null
  monthly_installment: number | null
  scarcity_remaining_units: number | null
  social_proof_score: number | null
  lat: number | null
  lng: number | null
}

const propertyTypes = [
  { value: '', label: 'كل الأنواع' },
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'administrative', label: 'إداري' },
  { value: 'medical', label: 'طبي' },
]

export default async function MarketplaceSearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()
  const searchTerm = sanitizeSearch(params.q)

  let query = supabase
    .from('marketplace_properties')
    .select('id, title_ar, city, district, property_type, unit_type, area_sqm, bedrooms, bathrooms, list_price, down_payment, monthly_installment, scarcity_remaining_units, social_proof_score, lat, lng')
    .eq('listing_status', 'published')
    .order('social_proof_score', { ascending: false })
    .limit(36)

  if (params.type) query = query.eq('property_type', params.type)
  if (params.city) query = query.eq('city', params.city)
  if (params.max && Number.isFinite(Number(params.max))) query = query.lte('list_price', Number(params.max))
  if (searchTerm) query = query.or(`title_ar.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%`)

  const { data, error } = await query
  const properties = (data ?? []) as MarketplaceProperty[]
  const cities = Array.from(new Set(properties.map((property) => property.city))).filter(Boolean)

  return (
    <main className="min-h-screen bg-[var(--fi-bg)] p-4 sm:p-6" dir="rtl">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="ds-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">FAST INVESTMENT MARKETPLACE</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--fi-ink)]">بحث ذكي في العقارات</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[var(--fi-muted)]">
            اكتب وصفاً مثل: مكتب إداري في العاصمة الإدارية بمقدم مليون جنيه، أو استخدم الفلاتر المتسلسلة للوصول إلى أفضل نتيجة.
          </p>
        </div>

        <form className="ds-card grid gap-3 p-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <label className="relative">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-emerald)]" />
            <input
              name="q"
              defaultValue={params.q ?? ''}
              className="h-11 w-full rounded-lg border border-[var(--fi-line)] bg-white pr-9 pl-3 text-sm font-bold outline-none focus:border-[var(--fi-emerald)] dark:bg-white/5"
              placeholder="ابحث باللغة الطبيعية..."
            />
          </label>
          <select name="type" defaultValue={params.type ?? ''} className="h-11 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold dark:bg-white/5">
            {propertyTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <select name="city" defaultValue={params.city ?? ''} className="h-11 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold dark:bg-white/5">
            <option value="">كل المدن</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <input
            name="max"
            defaultValue={params.max ?? ''}
            type="number"
            min={0}
            className="h-11 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold dark:bg-white/5"
            placeholder="أقصى سعر"
          />
          <button className="fi-primary-button min-h-11 rounded-lg px-5 text-sm font-black">بحث</button>
        </form>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            تعذر تحميل نتائج البحث: {error.message}
          </div>
        ) : null}

        {properties.some((p) => p.lat && p.lng) && (
          <MarketplaceMap properties={properties} />
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <article key={property.id} className="ds-card ds-card-hover overflow-hidden">
              <div className="bg-[#0C1A2E] p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                      {labelType(property.property_type)}
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-xl font-black">{property.title_ar}</h2>
                  </div>
                  {property.scarcity_remaining_units ? (
                    <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black">
                      {property.scarcity_remaining_units} متبقية
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/70">
                  <MapPin className="size-4" />
                  {property.city}
                  {property.district ? `، ${property.district}` : ''}
                </p>
              </div>
              <div className="space-y-4 p-5">
                <p className="text-2xl font-black text-[var(--fi-ink)]">
                  {Number(property.list_price).toLocaleString('ar-EG')} ج.م
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Spec icon={<Building2 className="size-4" />} label={`${property.area_sqm ?? '-'} م²`} />
                  <Spec icon={<BedDouble className="size-4" />} label={`${property.bedrooms ?? '-'} غرف`} />
                  <Spec icon={<Bath className="size-4" />} label={`${property.bathrooms ?? '-'} حمام`} />
                </div>
                <div className="rounded-lg bg-[var(--fi-soft)] p-3">
                  <p className="flex items-center gap-2 text-xs font-black text-[var(--fi-emerald)]">
                    <TrendingUp className="size-4" />
                    دليل اجتماعي: {Number(property.social_proof_score ?? 0).toLocaleString('ar-EG')} نقطة اهتمام
                  </p>
                  <p className="mt-2 text-xs font-bold text-[var(--fi-muted)]">
                    مقدم: {Number(property.down_payment ?? 0).toLocaleString('ar-EG')} ج.م · قسط: {Number(property.monthly_installment ?? 0).toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
                <Link href={`/marketplace/${property.id}`} className="fi-primary-button flex min-h-11 items-center justify-center rounded-lg text-sm font-black">
                  عرض التفاصيل
                </Link>
              </div>
            </article>
          ))}
          {!properties.length ? (
            <div className="ds-card p-12 text-center text-sm font-bold text-[var(--fi-muted)] md:col-span-2 xl:col-span-3">
              لا توجد نتائج مطابقة حالياً. جرّب تغيير الفلاتر أو توسيع نطاق السعر.
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}

function Spec({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="rounded-lg bg-[var(--fi-soft)] p-3 text-xs font-black text-[var(--fi-ink)]">
      <span className="mx-auto mb-1 flex justify-center text-[var(--fi-emerald)]">{icon}</span>
      {label}
    </div>
  )
}

function labelType(type: string) {
  const labels: Record<string, string> = {
    residential: 'سكني',
    commercial: 'تجاري',
    administrative: 'إداري',
    medical: 'طبي',
    mixed: 'متعدد الاستخدام',
    land: 'أرض',
  }

  return labels[type] ?? type
}

function sanitizeSearch(value: string | undefined) {
  return value?.trim().replace(/[,%]/g, ' ').replace(/\s+/g, ' ').slice(0, 80) || ''
}
