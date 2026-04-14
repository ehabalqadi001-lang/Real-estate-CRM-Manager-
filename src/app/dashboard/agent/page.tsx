import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Target, Trophy, Clock, Phone, ArrowLeft, Building2, UserCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AgentDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. جلب بيانات الوكيل
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single()

  // 2. جلب محفظة العملاء الخاصة بهذا الوكيل فقط
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  // 3. العمليات الحسابية لمؤشرات الأداء (KPIs)
  const totalLeads = leads?.length || 0
  const wonLeads = leads?.filter(lead => lead.status === 'Won') || []
  const freshLeads = leads?.filter(lead => lead.status === 'Fresh Leads' || !lead.status) || []
  const totalWonValue = wonLeads.reduce((sum, lead) => sum + (Number(lead.expected_value) || 0), 0)

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50/50" dir="rtl">
      
      {/* الهيدر الترحيبي للوكيل */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-lg">
            <UserCircle size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">أهلاً بك، {profile?.full_name || 'وكيل المبيعات'}</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">مساحة العمل التكتيكية الخاصة بك</p>
          </div>
        </div>
        <Link href="/dashboard/leads" className="bg-[#0A1128] hover:bg-[#152042] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2">
          فتح مسار المبيعات <ArrowLeft size={18} />
        </Link>
      </div>

      {/* مؤشرات الأداء الفردية (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-blue-500"></div>
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600 group-hover:scale-110 transition-transform"><Target size={28}/></div>
          <div>
            <p className="text-xs font-black text-slate-400 mb-1">محفظة العملاء (Total Leads)</p>
            <h3 className="text-2xl font-black text-slate-900">{totalLeads}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
          <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform"><Trophy size={28}/></div>
          <div>
            <p className="text-xs font-black text-slate-400 mb-1">مبيعاتك المحققة (Won Value)</p>
            <h3 className="text-2xl font-black text-emerald-600">{totalWonValue.toLocaleString()} <span className="text-sm">ج.م</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-amber-500"></div>
          <div className="bg-amber-50 p-4 rounded-xl text-amber-600 group-hover:scale-110 transition-transform"><Clock size={28}/></div>
          <div>
            <p className="text-xs font-black text-slate-400 mb-1">عملاء جدد بانتظار اتصالك</p>
            <h3 className="text-2xl font-black text-amber-600">{freshLeads.length}</h3>
          </div>
        </div>
      </div>

      {/* رادار التكليفات العاجلة (العملاء الجدد) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
          <Phone className="text-blue-600" size={20} />
          تكليفات القيادة (العملاء الجدد)
        </h3>

        {freshLeads.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Trophy size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-bold">عمل رائع! ليس لديك أي عملاء جدد متراكمين. استمر في متابعة باقي عملائك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {freshLeads.slice(0, 6).map((lead) => (
              <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="block group">
                <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-slate-900 group-hover:text-blue-700 transition-colors">{lead.client_name}</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 size={12}/> {lead.property_type || 'غير محدد'}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ArrowLeft size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}