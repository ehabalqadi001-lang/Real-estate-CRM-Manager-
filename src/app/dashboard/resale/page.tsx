import { getI18n } from '@/lib/i18n'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Home, Eye } from 'lucide-react'
import AddResaleButton from './AddResaleButton'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG_STYLES = {
  active:      { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
  under_offer: { color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100',     dot: 'bg-amber-500' },
  sold:        { color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100',       dot: 'bg-blue-500' },
  withdrawn:   { color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200',     dot: 'bg-slate-400' },
} as const

export default async function ResalePage() {
  const { t, numLocale } = await getI18n()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: listings } = await supabase
    .from('resale_listings')
    .select('*, profiles!resale_listings_agent_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  const total       = listings?.length ?? 0
  const active      = listings?.filter(l => l.status === 'active').length ?? 0
  const underOffer  = listings?.filter(l => l.status === 'under_offer').length ?? 0
  const sold        = listings?.filter(l => l.status === 'sold').length ?? 0
  const totalValue  = listings?.filter(l => l.status === 'active').reduce((s, l) => s + Number(l.asking_price || 0), 0) ?? 0

  const STATUS_CONFIG = {
    active:      { label: t('نشط', 'Active'),           ...STATUS_CONFIG_STYLES.active },
    under_offer: { label: t('تحت العرض', 'Under Offer'), ...STATUS_CONFIG_STYLES.under_offer },
    sold:        { label: t('مباع', 'Sold'),             ...STATUS_CONFIG_STYLES.sold },
    withdrawn:   { label: t('منسحب', 'Withdrawn'),       ...STATUS_CONFIG_STYLES.withdrawn },
  }

  const fmt = (n: number) => new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00C27C] rounded-xl flex items-center justify-center shadow-lg shadow-[#00C27C]/20">
            <Home size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">{t('سوق إعادة البيع', 'Resale Market')}</h1>
            <p className="text-xs text-slate-400">{total} {t('وحدة', 'units')} · {t('قيمة متاح', 'available value')} {fmt(totalValue)} {t('ج.م', 'EGP')}</p>
          </div>
        </div>
        <AddResaleButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('إجمالي الوحدات', 'Total Units'),  value: total,      color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: t('نشطة', 'Active'),                value: active,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: t('تحت العرض', 'Under Offer'),      value: underOffer, color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: t('مباعة', 'Sold'),                 value: sold,       color: 'text-purple-600',  bg: 'bg-purple-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className={`${k.bg} w-9 h-9 rounded-lg flex items-center justify-center`}>
              <span className={`text-sm font-black ${k.color}`}>{k.value}</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{k.label}</p>
              <p className={`text-base font-black ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Listings grid */}
      {(!listings || listings.length === 0) ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <Home size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="font-bold text-slate-600">{t('لا توجد وحدات إعادة بيع', 'No resale listings')}</p>
          <p className="text-sm text-slate-400 mt-1">{t('أضف أول وحدة إعادة بيع لبدء تتبع السوق الثانوي', 'Add the first resale unit to start tracking the secondary market')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map(listing => {
            const st = STATUS_CONFIG[listing.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active
            const profit = listing.original_price
              ? Number(listing.asking_price) - Number(listing.original_price)
              : null

            return (
              <div key={listing.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-l from-[#0C1A2E] to-[#0F2748] p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] text-white/40 font-bold">{listing.project_name}</p>
                      <h3 className="font-black text-base mt-0.5">
                        {listing.unit_type} {listing.bedrooms ? `· ${listing.bedrooms}غ` : ''} {listing.area_sqm ? `· ${listing.area_sqm}م²` : ''}
                      </h3>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${st.bg} ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  {listing.floor && (
                    <p className="text-xs text-white/40 mt-1">{t('دور', 'Floor')} {listing.floor} {listing.building ? `· ${listing.building}` : ''}</p>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">{t('سعر الطلب', 'Asking Price')}</p>
                      <p className="text-lg font-black text-[#00C27C]">{fmt(Number(listing.asking_price))} {t('ج.م', 'EGP')}</p>
                    </div>
                    {profit !== null && (
                      <div className="text-left">
                        <p className="text-[10px] text-slate-400 font-bold">{t('هامش الربح', 'Profit Margin')}</p>
                        <p className={`text-sm font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {profit >= 0 ? '+' : ''}{fmt(profit)} {t('ج.م', 'EGP')}
                        </p>
                      </div>
                    )}
                  </div>

                  {listing.seller_name && (
                    <p className="text-xs text-slate-500 border-t border-slate-50 pt-2">
                      {t('البائع:', 'Seller:')} <span className="font-bold text-slate-700">{listing.seller_name}</span>
                      {listing.seller_phone && (
                        <a href={`tel:${listing.seller_phone}`} className="text-blue-500 hover:underline mr-2" dir="ltr">{listing.seller_phone}</a>
                      )}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Eye size={11} /> {listing.views ?? 0} {t('مشاهدة', 'views')}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {listing.profiles?.full_name ?? t('وكيل', 'Agent')}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
