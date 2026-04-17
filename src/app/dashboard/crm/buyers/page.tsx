/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy page pending migration into domains/buyers with typed DTOs. */
import Link from 'next/link'
import { Users, Search, Star, Phone, DollarSign, MapPin, ArrowUpRight } from 'lucide-react'
import { getBuyers } from '@/domains/crm/actions'
import { scoreColor, scoreLabel } from '@/app/dashboard/leads/score-utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ query?: string; page?: string }>
}

const TIMELINE_LABELS: Record<string, string> = {
  urgent: 'عاجل',
  '3_months': '3 أشهر',
  '6_months': '6 أشهر',
  flexible: 'مرن',
}

const PURPOSE_LABELS: Record<string, string> = {
  سكن: '🏠 سكن',
  استثمار: '📈 استثمار',
  تأجير: '🔑 إيجار',
}

export default async function BuyersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const { buyers, total } = await getBuyers({ query: params.query, page })

  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

  return (
    <div className="p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">المشترون المؤهلون</h1>
            <p className="text-xs text-slate-400">{total} مشتري مهتم · عملاء في مراحل متقدمة</p>
          </div>
        </div>
        <form method="GET">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input
              name="query"
              defaultValue={params.query}
              placeholder="ابحث بالاسم أو الهاتف..."
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-48"
            />
          </div>
        </form>
      </div>

      {/* Grid */}
      {buyers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <Users size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="font-bold text-slate-600">لا يوجد مشترون مؤهلون حالياً</p>
          <p className="text-sm text-slate-400 mt-1">سيظهر هنا العملاء الذين وصلوا لمرحلة الاهتمام وما بعدها</p>
          <Link href="/dashboard/crm/leads" className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 font-bold hover:underline">
            عرض جميع العملاء المحتملين
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buyers.map((buyer: any) => {
            const name = buyer.full_name || buyer.client_name || 'مشتري'
            const req  = buyer.buyer_requirements?.[0]
            const score = buyer.score ?? 0

            return (
              <Link
                key={buyer.id}
                href={`/dashboard/crm/leads/${buyer.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-black text-sm">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{name}</p>
                      {buyer.phone && (
                        <p className="text-[11px] text-slate-400 font-medium" dir="ltr">{buyer.phone}</p>
                      )}
                    </div>
                  </div>
                  {score > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreColor(score)}`}>
                      {score} · {scoreLabel(score)}
                    </span>
                  )}
                </div>

                {/* Budget */}
                {(req?.min_budget || req?.max_budget) && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 rounded-lg px-2.5 py-1.5 mb-3 w-fit">
                    <DollarSign size={11} />
                    {req.min_budget ? `${fmt(req.min_budget)} —` : ''}
                    {req.max_budget ? ` ${fmt(req.max_budget)} ج.م` : ''}
                  </div>
                )}

                {/* Requirements */}
                {req && (
                  <div className="space-y-1.5 text-[11px] text-slate-500">
                    {req.property_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {req.property_types.slice(0, 3).map((t: string) => (
                          <span key={t} className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold">{t}</span>
                        ))}
                      </div>
                    )}
                    {req.preferred_areas?.length > 0 && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin size={10} />
                        {req.preferred_areas.slice(0, 2).join(' · ')}
                      </div>
                    )}
                    {req.purpose && (
                      <div className="text-slate-500 font-medium">
                        {PURPOSE_LABELS[req.purpose] ?? req.purpose}
                      </div>
                    )}
                    {req.timeline && (
                      <div className="text-slate-400">
                        الجدول الزمني: {TIMELINE_LABELS[req.timeline] ?? req.timeline}
                      </div>
                    )}
                  </div>
                )}

                {!req && (
                  <p className="text-xs text-slate-300 italic">لم يتم تسجيل متطلبات الشراء بعد</p>
                )}

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(buyer.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    عرض الملف <ArrowUpRight size={11} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 40 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`?query=${params.query ?? ''}&page=${page - 1}`}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
              السابق
            </Link>
          )}
          <span className="px-4 py-2 text-sm font-bold text-slate-500">
            صفحة {page} · {total} نتيجة
          </span>
          {page * 40 < total && (
            <Link href={`?query=${params.query ?? ''}&page=${page + 1}`}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700">
              التالي
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
