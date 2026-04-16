import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import InventoryGrid from '@/components/inventory/InventoryGrid'
import InventoryHeatMap from '@/components/inventory/InventoryHeatMap'
import AddUnitButton from '@/components/inventory/AddUnitButton'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Unit {
  id: string
  unit_name: string
  project_name: string
  unit_type: string
  price: number
  status: string
  floor?: number
}

export default async function InventoryPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  let inventory: Unit[] = []
  let fetchError: string | null = null
  let exactErrorDetails: string | null = null

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, developers(name)')
      .order('created_at', { ascending: false })

    if (error) { exactErrorDetails = error.message; throw error }
    inventory = data || []
  } catch (e: unknown) {
    fetchError = 'تعذر جلب بيانات المخزون العقاري.'
    if (!exactErrorDetails) exactErrorDetails = e instanceof Error ? e.message : 'Unknown error'
  }

  const available = inventory.filter(u => u.status === 'available').length
  const reserved  = inventory.filter(u => u.status === 'reserved').length
  const sold      = inventory.filter(u => u.status === 'sold').length
  const totalVal  = inventory.filter(u => u.status === 'available').reduce((s, u) => s + Number(u.price || 0), 0)

  const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6 p-6" dir="rtl">

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المخزون العقاري</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة الوحدات، المشاريع، والأسعار المتاحة للبيع</p>
        </div>
        <AddUnitButton />
      </div>

      {fetchError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
          <p className="text-red-600 font-bold mb-2">تنبيه النظام</p>
          <p className="text-sm text-slate-500 mb-4">{fetchError}</p>
          <code className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-xs font-mono inline-block" dir="ltr">
            {exactErrorDetails}
          </code>
        </div>
      ) : (
        <>
          {/* KPI summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
              <div className="bg-emerald-50 w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle size={22} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">متاحة</p>
                <p className="text-2xl font-black text-slate-900">{available}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-4">
              <div className="bg-amber-50 w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={22} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">محجوزة</p>
                <p className="text-2xl font-black text-slate-900">{reserved}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
              <div className="bg-red-50 w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <XCircle size={22} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">مباعة</p>
                <p className="text-2xl font-black text-slate-900">{sold}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4">
              <div className="bg-blue-50 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-blue-600">
                ج.م
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">قيمة المتاح</p>
                <p className="text-lg font-black text-slate-900">{fmt(totalVal)}</p>
              </div>
            </div>
          </div>

          {/* Heat map */}
          <InventoryHeatMap units={inventory} />

          {/* Grid list */}
          <InventoryGrid initialData={inventory} />
        </>
      )}
    </div>
  )
}
