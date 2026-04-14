import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AlertTriangle, Users, Building, TrendingUp, UserPlus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CompanyDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // جلب بيانات الشركة من قاعدة البيانات
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl flex items-start gap-4 m-8" dir="rtl">
        <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
        <div>
          <h3 className="font-bold text-red-800">خطأ في جلب بيانات الشركة</h3>
          <p className="text-sm text-red-600 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8" dir="rtl">
      
      {/* هيدر ترحيبي */}
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">مرحباً، {profile?.company_name || profile?.full_name}</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">لوحة تحكم إدارة وكلاء البيع والمبيعات</p>
        </div>
        <Link 
          href="/company/agents/add" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
        >
          <UserPlus size={18} /> إضافة وكيل جديد
        </Link>
      </div>

      {/* إحصائيات سريعة للشركة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-blue-300 transition-colors">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Users size={24}/></div>
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي الوكلاء (Agents)</p>
            <h3 className="text-xl font-black text-slate-900">0 وكيل</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-colors">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><TrendingUp size={24}/></div>
          <div>
            <p className="text-xs font-bold text-slate-400">مبيعات الشركة (Won)</p>
            <h3 className="text-xl font-black text-slate-900">0 ج.م</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-purple-300 transition-colors">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><Building size={24}/></div>
          <div>
            <p className="text-xs font-bold text-slate-400">العملاء المحتملين (Leads)</p>
            <h3 className="text-xl font-black text-slate-900">0 عميل</h3>
          </div>
        </div>
      </div>

      {/* منطقة الوكلاء (الفارغة حالياً) */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center py-24">
        <Users size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">لا يوجد وكلاء بيع مسجلين حتى الآن</h3>
        <p className="text-sm text-slate-500 mb-6">قم بإنشاء حسابات لفريق المبيعات الخاص بك لتبدأ متابعة أدائهم</p>
        <Link href="/company/agents/add" className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-1">
          إضافة أول وكيل <UserPlus size={16} />
        </Link>
      </div>

    </div>
  )
}