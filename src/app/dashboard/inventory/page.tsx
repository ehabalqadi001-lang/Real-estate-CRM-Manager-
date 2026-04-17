import { CheckCircle, Clock, XCircle, Building2, TrendingUp, DollarSign } from 'lucide-react'
import AddUnitButton from '@/components/inventory/AddUnitButton'
import InventoryGrid from '@/components/inventory/InventoryGrid'
import InventoryHeatMap from '@/components/inventory/InventoryHeatMap'
import { getInventoryOverview } from '@/domains/inventory/queries'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const { units: inventory, projects, stats, error: fetchError, errorDetails } = await getInventoryOverview()
  const { available, reserved, sold, totalValue, averagePrice, soldRate } = stats
  const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="text-[#00C27C]" size={24} /> المشاريع والوحدات العقارية
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {projects.length} مشروع · {inventory.length} وحدة إجمالية
          </p>
        </div>
        <AddUnitButton />
      </div>

      {fetchError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
          <p className="text-red-600 font-bold mb-2">تنبيه النظام</p>
          <p className="text-sm text-slate-500 mb-4">{fetchError}</p>
          <code className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-xs font-mono inline-block" dir="ltr">
            {errorDetails}
          </code>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'متاحة', value: available, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'محجوزة', value: reserved, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
              { label: 'مباعة', value: sold, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
              { label: 'نسبة البيع', value: `${soldRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
              { label: 'قيمة المتاح', value: fmt(totalValue), icon: DollarSign, color: 'text-[#00C27C]', bg: 'bg-[#00C27C]/10', border: 'border-[#00C27C]/20' },
              { label: 'متوسط السعر', value: fmt(averagePrice), icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-white p-4 rounded-2xl shadow-sm border ${kpi.border} flex items-center gap-3`}>
                <div className={`${kpi.bg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                  <kpi.icon size={18} className={kpi.color} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">{kpi.label}</p>
                  <p className="text-base font-black text-slate-900 leading-tight">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          <InventoryHeatMap units={inventory} />
          <InventoryGrid initialData={inventory} />
        </>
      )}
    </div>
  )
}
