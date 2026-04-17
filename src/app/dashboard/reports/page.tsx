'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DealReportRow {
  id: string
  unit_value?: number | null
  amount_paid?: number | null
  stage?: string | null
  developer?: { name?: string | null } | string | null
}

export default function ReportsPage() {
  const [deals, setDeals] = useState<DealReportRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchReportData() {
      const { data } = await supabase
        .from('deals')
        .select('id, unit_value, amount_paid, stage, developer:developers(name)')
        .order('created_at', { ascending: false })

      if (!mounted) return
      setDeals((data ?? []) as DealReportRow[])
      setLoading(false)
    }

    void fetchReportData()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return <div className="p-12 text-center font-bold text-slate-500" dir="rtl">جاري تجميع البيانات التحليلية...</div>
  }

  const totalSales = deals.reduce((sum, deal) => sum + Number(deal.unit_value || 0), 0)
  const totalCollected = deals.reduce((sum, deal) => sum + Number(deal.amount_paid || 0), 0)
  const closedDealsCount = deals.filter((deal) => ['Contracted', 'Registration', 'Handover'].includes(String(deal.stage ?? ''))).length

  const devPerformance: Record<string, number> = {}
  deals.forEach((deal) => {
    const dev = deal.developer
    const devName = typeof dev === 'object' && dev?.name ? dev.name : typeof dev === 'string' ? dev : 'غير محدد'
    devPerformance[devName] = (devPerformance[devName] ?? 0) + Number(deal.unit_value || 0)
  })

  const sortedDevs = Object.entries(devPerformance).sort((a, b) => b[1] - a[1])
  const maxDevSales = sortedDevs.length > 0 ? sortedDevs[0][1] : 1

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-8">
        <h1 className="flex items-center gap-3 text-3xl font-black text-slate-950">
          <svg width="28" height="28" fill="none" stroke="#185FA5" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
          لوحة التقارير والتحليلات المالية
        </h1>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">إجمالي المبيعات (Total Sales Volume)</p>
            <p className="mt-3 text-3xl font-black text-slate-950" dir="ltr">{totalSales.toLocaleString()} EGP</p>
            <span className="mt-3 inline-flex rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">نمو عن الشهر السابق</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">إجمالي التحصيلات المدفوعة</p>
            <p className="mt-3 text-3xl font-black text-emerald-600" dir="ltr">{totalCollected.toLocaleString()} EGP</p>
            <span className="mt-3 inline-flex rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">سيولة نقدية محققة</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">نسبة الإغلاق (Closed Deals)</p>
            <p className="mt-3 text-3xl font-black text-violet-600">{closedDealsCount} صفقات</p>
            <span className="mt-3 inline-flex rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">تمت كتابة العقود بنجاح</span>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="border-b border-slate-100 pb-4 text-xl font-black text-slate-900">
            تقرير أداء المطورين العقاريين (Developer Performance)
          </h2>

          <div className="mt-6 space-y-5">
            {sortedDevs.length === 0 ? (
              <div className="py-10 text-center text-slate-500">لا توجد بيانات مبيعات حتى الآن.</div>
            ) : (
              sortedDevs.map(([devName, sales]) => {
                const percentage = (sales / maxDevSales) * 100
                return (
                  <div key={devName}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-slate-900">{devName === 'غير محدد' ? 'تنبيه: غير محدد' : devName}</span>
                      <span className="font-black text-blue-700" dir="ltr">{sales.toLocaleString()} EGP</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          background: devName === 'غير محدد' ? '#DC2626' : 'linear-gradient(90deg, #185FA5, #3b82f6)',
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {sortedDevs.some(([name]) => name === 'غير محدد') && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            تنبيه: توجد مبيعات مسجلة تحت بند غير محدد. يرجى تعديل هذه الصفقات وربطها بالمطور الصحيح لضمان دقة التقارير والعمولات.
          </div>
        )}
      </div>
    </div>
  )
}
