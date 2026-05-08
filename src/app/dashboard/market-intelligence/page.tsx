import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { TrendingUp, TrendingDown, BarChart3, Globe } from 'lucide-react'
import { AddMarketDataForm, AIInsightButton, DemandBadge } from './MarketIntelClient'

export const dynamic = 'force-dynamic'

export default async function MarketIntelligencePage() {
  await requirePermission('report.view.own')
  const { profile } = await requireSession()
  const supabase = await createRawClient()
  const companyId = profile.company_id ?? profile.id

  const { data: raw } = await supabase
    .from('market_intelligence')
    .select('*')
    .or(`company_id.eq.${companyId},company_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(100)

  const records = raw ?? []

  const avgPrice = records.length
    ? Math.round(records.reduce((s, r) => s + Number(r.avg_price_sqm ?? 0), 0) / records.filter((r) => r.avg_price_sqm).length)
    : 0

  const highDemand = records.filter((r) => r.demand_level === 'high').length
  const regions = [...new Set(records.map((r) => r.region))].length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--fi-emerald)]">NEXUS Intelligence</p>
          <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">ذكاء السوق العقاري</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            تتبع أسعار السوق، مستويات الطلب، واتجاهات التطوير في كل منطقة.
          </p>
        </div>
        <AddMarketDataForm companyId={companyId} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
          <div className="mb-2 text-[var(--fi-emerald)]"><BarChart3 className="size-5" /></div>
          <p className="text-2xl font-black text-[var(--fi-ink)]">
            {avgPrice ? avgPrice.toLocaleString('ar-EG') : '—'}
          </p>
          <p className="text-xs font-semibold text-[var(--fi-muted)]">متوسط السعر ج.م/م²</p>
        </div>
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
          <div className="mb-2 text-emerald-600"><TrendingUp className="size-5" /></div>
          <p className="text-2xl font-black text-[var(--fi-ink)]">{highDemand}</p>
          <p className="text-xs font-semibold text-[var(--fi-muted)]">منطقة بطلب مرتفع</p>
        </div>
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
          <div className="mb-2 text-[#C9964A]"><Globe className="size-5" /></div>
          <p className="text-2xl font-black text-[var(--fi-ink)]">{regions}</p>
          <p className="text-xs font-semibold text-[var(--fi-muted)]">منطقة مرصودة</p>
        </div>
      </div>

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--fi-line)] py-16 text-center">
          <BarChart3 className="size-10 text-[var(--fi-line)]" />
          <p className="font-bold text-[var(--fi-muted)]">لا توجد بيانات سوق بعد</p>
          <p className="text-xs text-[var(--fi-muted)]">أضف أول نقطة بيانات باستخدام زر &quot;إضافة بيانات سوق&quot;</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((r) => (
            <div key={r.id} className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-[var(--fi-ink)]">{r.region}</h3>
                    {r.zone && <span className="text-xs font-semibold text-[var(--fi-muted)]">— {r.zone}</span>}
                    <DemandBadge level={r.demand_level ?? 'medium'} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    {r.avg_price_sqm && (
                      <span className="font-black text-[var(--fi-emerald)]">
                        {Number(r.avg_price_sqm).toLocaleString('ar-EG')} ج.م/م²
                      </span>
                    )}
                    {r.price_change_pct !== null && (
                      <span className={`flex items-center gap-1 font-bold ${Number(r.price_change_pct) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {Number(r.price_change_pct) >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                        {Math.abs(Number(r.price_change_pct))}% {Number(r.price_change_pct) >= 0 ? 'ارتفاع' : 'انخفاض'}
                      </span>
                    )}
                    {r.supply_units && (
                      <span className="font-semibold text-[var(--fi-muted)]">{r.supply_units.toLocaleString('ar-EG')} وحدة معروضة</span>
                    )}
                  </div>
                  {r.notes && <p className="mt-2 text-xs font-semibold text-[var(--fi-muted)]">{r.notes}</p>}
                  {r.source_url && (
                    <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-[var(--fi-emerald)] underline">
                      المصدر
                    </a>
                  )}
                </div>
                <span className="text-xs font-semibold text-[var(--fi-muted)]">
                  {new Date(r.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>

              <AIInsightButton
                region={r.region}
                priceData={`المنطقة: ${r.region}${r.zone ? ' / ' + r.zone : ''}, السعر: ${r.avg_price_sqm ?? 'غير محدد'} ج.م/م², التغير: ${r.price_change_pct ?? 0}%, الطلب: ${r.demand_level}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
