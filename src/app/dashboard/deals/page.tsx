import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import DealsGrid from '../../../components/deals/DealsGrid'
import AddDealButton from '../../../components/deals/AddDealButton'

export default async function DealsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  let deals: any[] = []
  let fetchError = null

  try {
    // جلب الصفقات مع اسم العميل المرتبط بها
    const { data, error } = await supabase
      .from('deals')
      .select('*, clients(name)')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    deals = data || []
  } catch (e: any) {
    fetchError = "تأكد من إنشاء جدول deals وربطه بجدول clients في Supabase."
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الهيدر */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الصفقات (Deals)</h1>
          <p className="text-sm text-slate-500 mt-1">متابعة المبيعات، العقود، والتحصيلات المالية</p>
        </div>
        <AddDealButton />
      </div>

      {/* المحتوى */}
      {fetchError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
           <p className="text-red-600 font-bold mb-2">تعذر جلب الصفقات</p>
           <p className="text-sm text-slate-500">{fetchError}</p>
        </div>
      ) : (
        <DealsGrid initialDeals={deals} />
      )}
    </div>
  )
}