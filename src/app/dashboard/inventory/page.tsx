import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import InventoryGrid from '@/components/inventory/InventoryGrid'
import AddUnitButton from '@/components/inventory/AddUnitButton'

// منع الكاش لضمان جلب البيانات الحية دائماً
export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  interface Unit { id: string; unit_name: string; project_name: string; unit_type: string; price: number; status: string }
  let inventory: Unit[] = []
  let fetchError = null
  let exactErrorDetails: string | null = null

  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, developers(name)')
      .order('created_at', { ascending: false })

    if (error) {
      exactErrorDetails = error.message
      throw error
    }
    inventory = data || []
  } catch (e: unknown) {
    fetchError = "تعذر جلب بيانات المخزون العقاري. تأكد من إعداد قاعدة البيانات."
    if (!exactErrorDetails) exactErrorDetails = e instanceof Error ? e.message : "Unknown Network/DB Error"
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الهيدر */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المخزون العقاري (Inventory)</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة الوحدات، المشاريع، والأسعار المتاحة للبيع</p>
        </div>
        <AddUnitButton />
      </div>

      {/* نظام عرض الأخطاء القياسي الجديد */}
      {fetchError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
           <p className="text-red-600 font-bold mb-2">تنبيه النظام</p>
           <p className="text-sm text-slate-500 mb-4">{fetchError}</p>
           <code className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-xs font-mono inline-block text-left" dir="ltr">
             Technical Error: {exactErrorDetails}
           </code>
        </div>
      ) : (
        <InventoryGrid initialData={inventory} />
      )}
    </div>
  )
}