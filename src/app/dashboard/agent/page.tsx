import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Target, Clock, Trophy, ArrowLeft, Phone } from 'lucide-react'
import LeadScoreBadge from '@/components/leads/LeadScoreBadge' // <-- استدعاء المؤشر الذكي

export const dynamic = 'force-dynamic'

export default async function AgentDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // جلب بيانات الوكيل
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
  
  // جلب عملاء الوكيل
  const { data: leads } = await supabase.from('leads').select('*').eq('agent_id', user?.id)
  const safeLeads = leads || []
  
  const newLeads = safeLeads.filter(l => l.status === 'new' || !l.status)
  const wonLeads = safeLeads.filter(l => l.status === 'Won')
  const totalWonValue = wonLeads.reduce((sum, l) => sum + (Number(l.expected_value) || 0), 0)

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50/50" dir="rtl">
      {/* الترحيب */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">أهلاً بك، {profile?.full_name}</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">مساحة العمل التكتيكية الخاصة بك في EHAB & ESLAM TEAM</p>
        </div>
        <Link href="/dashboard/leads" className="bg-[#0A1128] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
          فتح مسار المبيعات <ArrowLeft size={18} />
        </Link>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-r-4 border-r-blue-500">
          <p className="text-sm font-bold text-slate-500 mb-2">محفظة العملاء (Total Leads)</p>
          <h3 className="text-3xl font-black text-slate-900">{safeLeads.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-r-4 border-r-emerald-500">
          <p className="text-sm font-bold text-slate-500 mb-2">مبيعاتك المحققة (Won Value)</p>
          <h3 className="text-3xl font-black text-emerald-600">{totalWonValue.toLocaleString()} ج.م</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-r-4 border-r-amber-500">
          <p className="text-sm font-bold text-slate-500 mb-2">عملاء جدد بانتظار اتصالك</p>
          <h3 className="text-3xl font-black text-amber-600">{newLeads.length}</h3>
        </div>
      </div>

      {/* تكليفات القيادة (العملاء الجدد) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Phone size={20} className="text-blue-600" /> تكليفات القيادة (العملاء الجدد)
          </h3>
        </div>
        <div className="p-5">
          {newLeads.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-bold">عمل رائع! ليس لديك أي عملاء جدد متراكمين.</div>
          ) : (
            <div className="space-y-3">
              {newLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                  <div>
                    <h4 className="font-black text-slate-900">{lead.client_name}</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">{lead.phone}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* زرعنا المؤشر الذكي هنا! */}
                    <LeadScoreBadge score={lead.score || 0} />
                    
                    <Link href={`/dashboard/leads/${lead.id}`} className="bg-white border border-slate-200 hover:border-blue-500 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-black transition-all">
                      بدء العمل
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}