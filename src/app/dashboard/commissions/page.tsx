import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CommissionsList from '@/components/commissions/CommissionsList'
import AddCommissionButton from '@/components/commissions/AddCommissionButton'
import { Wallet, CheckCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CommissionsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  interface Commission { id: string; amount: number; status: string; created_at: string; team_members?: { name?: string }; deals?: { title?: string } }
  let commissions: Commission[] = []
  let fetchError = null
  let exactErrorDetails: string | null = null

  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('*, deals(title, value), team_members(name)')
      .order('created_at', { ascending: false })
      
    if (error) { exactErrorDetails = error.message; throw error; }
    commissions = data || []
  } catch (e: unknown) {
    fetchError = "تعذر جلب السجل المالي والعمولات."
    exactErrorDetails = exactErrorDetails || (e instanceof Error ? e.message : 'Unknown error')
  }

  // حساب الإحصائيات المالية
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  return (
    <div className="space-y-6" dir="rtl">
      {/* الهيدر */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="text-emerald-600" /> إدارة العمولات
          </h1>
          <p className="text-sm text-slate-500 mt-1">تتبع مستحقات فريق المبيعات والتحصيلات</p>
        </div>
        <AddCommissionButton />
      </div>

      {/* نظام صائد الأخطاء */}
      {fetchError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center animate-in fade-in">
           <p className="text-red-600 font-bold mb-2">تنبيه النظام (System Alert)</p>
           <p className="text-sm text-slate-500 mb-4">{fetchError}</p>
           <code className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-xs font-mono inline-block text-left" dir="ltr">
             Error: {exactErrorDetails}
           </code>
        </div>
      ) : (
        <>
          {/* المؤشرات المالية (KPIs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-amber-600 mb-1">إجمالي العمولات المعلقة</p>
                <h3 className="text-2xl font-black text-slate-900">
                  {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalPending)}
                </h3>
              </div>
              <div className="bg-amber-50 p-3 rounded-full text-amber-500"><Clock size={24} /></div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-600 mb-1">إجمالي العمولات المصروفة</p>
                <h3 className="text-2xl font-black text-slate-900">
                  {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalPaid)}
                </h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-full text-emerald-500"><CheckCircle size={24} /></div>
            </div>
          </div>

          {/* قائمة العمولات التفصيلية */}
          <CommissionsList commissions={commissions} />
        </>
      )}
    </div>
  )
}