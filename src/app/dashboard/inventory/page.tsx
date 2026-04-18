import { CheckCircle, Clock, XCircle, Building2, TrendingUp, DollarSign } from 'lucide-react'
import AddUnitButton from '@/components/inventory/AddUnitButton'
import InventoryGrid from '@/components/inventory/InventoryGrid'
import InventoryHeatMap from '@/components/inventory/InventoryHeatMap'
import { getInventoryOverview } from '@/domains/inventory/queries'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const { units: inventory, projects, stats, error: fetchError, errorDetails } = await getInventoryOverview()
  const { available, reserved, sold, totalValue, averagePrice, soldRate } = stats

  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-5 p-4 sm:p-6" dir="rtl">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <Building2 size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">المشاريع والوحدات العقارية</h1>
            <p className="text-xs text-[var(--fi-muted)]">
              {projects.length} مشروع · {inventory.length} وحدة إجمالية
            </p>
          </div>
        </div>
        <AddUnitButton />
      </div>

      {fetchError ? (
        <div className="rounded-2xl border border-red-100 bg-[var(--fi-paper)] p-10 text-center shadow-sm">
          <p className="font-bold text-red-600">تنبيه النظام</p>
          <p className="mt-1 text-sm text-[var(--fi-muted)]">{fetchError}</p>
          <code className="mt-3 inline-block rounded-lg bg-red-50 px-4 py-2 text-xs font-mono text-red-800" dir="ltr">
            {errorDetails}
          </code>
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { label: 'متاحة',       value: available,       icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'محجوزة',      value: reserved,        icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'مباعة',       value: sold,            icon: XCircle,     color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'نسبة البيع',  value: `${soldRate}%`,  icon: TrendingUp,  color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'قيمة المتاح', value: fmt(totalValue), icon: DollarSign,  color: 'text-[var(--fi-emerald)]', bg: 'bg-[var(--fi-soft)]' },
              { label: 'متوسط السعر', value: fmt(averagePrice),icon: DollarSign, color: 'text-[var(--fi-muted)]',   bg: 'bg-[var(--fi-soft)]' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="flex items-center gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm"
              >
                <div className={`${kpi.bg} flex size-10 shrink-0 items-center justify-center rounded-xl`}>
                  <kpi.icon size={18} className={kpi.color} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--fi-muted)]">{kpi.label}</p>
                  <p className={`fi-tabular truncate text-base font-black leading-tight ${kpi.color}`}>{kpi.value}</p>
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
