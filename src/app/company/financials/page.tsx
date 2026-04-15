import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Wallet, CheckCircle2, Clock, DollarSign, ShieldCheck } from 'lucide-react'
import CommissionStatusButton from '@/components/financials/CommissionStatusButton' // سنقوم بإنشائه في الخطوة القادمة

export const dynamic = 'force-dynamic'

export default async function FinancialsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. تحديد هوية الشركة للقيادة
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single()
  const targetCompanyId = profile?.company_id || user?.id

  // 2. جلب جميع العمولات المرتبطة بوكلاء الشركة
  const { data: commissions } = await supabase
    .from('commissions')
    .select(`
      *,
      deals ( final_price, leads ( client_name ) ),
      profiles!commissions_agent_id_fkey ( full_name )
    `)
    .order('created_at', { ascending: false })

  // 3. العمليات الحسابية للوحة الرقابة
  const safeCommissions = commissions || []
  
  const totalPending = safeCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0)
  const totalApproved = safeCommissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + Number(c.amount), 0)
  const totalPaid = safeCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50/50" dir="rtl">
      
      {/* الهيدر المالي */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center shadow-lg">
            <Wallet size={28} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">الرقابة المالية والعمولات</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">مراجعة واعتماد مستحقات فريق المبيعات</p>
          </div>
        </div>
      </div>

      {/* مؤشرات التدفق المالي (Financial KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-amber-500"></div>
          <div className="bg-amber-50 p-4 rounded-xl text-amber-600"><Clock size={28}/></div>
          <div>
            <p className="text-xs font-black text-slate-400 mb-1">عمولات قيد المراجعة (Pending)</p>
            <h3 className="text-2xl font-black text-slate-900">{totalPending.toLocaleString()} <span className="text-sm">ج.م</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-blue-500"></div>
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600"><ShieldCheck size={28}/></div>
          <div>
            <p className="text-xs font-black text-slate-400 mb-1">عمولات معتمدة (Approved)</p>
            <h3 className="text-2xl font-black text-blue-600">{totalApproved.toLocaleString()} <span className="text-sm">ج.م</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
          <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600"><CheckCircle2 size={28}/></div>
          <div>
            <p className="text-xs font-black text-slate-400 mb-1">تم الصرف (Paid)</p>
            <h3 className="text-2xl font-black text-emerald-600">{totalPaid.toLocaleString()} <span className="text-sm">ج.م</span></h3>
          </div>
        </div>
      </div>

      {/* سجل العمولات */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-600" />
            سجل المطالبات المالية
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
              <tr>
                <th className="p-4">الوكيل المستفيد</th>
                <th className="p-4">الصفقة (العميل)</th>
                <th className="p-4">قيمة العقد</th>
                <th className="p-4 text-emerald-600">مبلغ العمولة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">القرار الإداري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeCommissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">لا توجد مطالبات مالية حتى الآن.</td>
                </tr>
              ) : (
                safeCommissions.map((comm: any) => (
                  <tr key={comm.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-black text-slate-900">{comm.profiles?.full_name}</td>
                    <td className="p-4 text-sm font-bold text-slate-600">{comm.deals?.leads?.client_name}</td>
                    <td className="p-4 text-sm font-bold text-slate-500">{Number(comm.deals?.final_price).toLocaleString()} ج.م</td>
                    <td className="p-4 text-md font-black text-emerald-600">{Number(comm.amount).toLocaleString()} ج.م</td>
                    <td className="p-4">
                      {comm.status === 'pending' && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-lg">قيد المراجعة</span>}
                      {comm.status === 'approved' && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-black rounded-lg">معتمدة</span>}
                      {comm.status === 'paid' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg">تم الصرف</span>}
                    </td>
                    <td className="p-4">
                      {/* زر تفاعلي للتحكم في الحالة */}
                      <CommissionStatusButton commissionId={comm.id} currentStatus={comm.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}