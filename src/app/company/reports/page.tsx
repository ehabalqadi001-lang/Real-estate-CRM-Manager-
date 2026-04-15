import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { BarChart3, TrendingUp, Trophy, DollarSign, Target, Activity, Medal } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. تحديد هوية الشركة
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single()
  const targetCompanyId = profile?.company_id || user?.id

  // 2. جلب الذخيرة (الوكلاء + العملاء)
  const [{ data: agents }, { data: leads }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').eq('company_id', targetCompanyId).eq('role', 'agent'),
    supabase.from('leads').select('id, expected_value, status, user_id').eq('company_id', targetCompanyId)
  ])

  // 3. المحرك التحليلي (المعادلات المالية)
  const safeLeads = leads || []
  const safeAgents = agents || []

  // أ. التوقعات المالية (Pipeline Forecast vs Closed Revenue)
  const wonLeads = safeLeads.filter(l => l.status === 'Won')
  const activeLeads = safeLeads.filter(l => l.status !== 'Won' && l.status !== 'Lost')
  
  const totalWonValue = wonLeads.reduce((sum, lead) => sum + (Number(lead.expected_value) || 0), 0)
  const totalActiveValue = activeLeads.reduce((sum, lead) => sum + (Number(lead.expected_value) || 0), 0)
  const averageDealSize = wonLeads.length > 0 ? totalWonValue / wonLeads.length : 0

  // ب. لوحة الشرف (Leaderboard Calculation)
  const agentPerformance = safeAgents.map(agent => {
    const agentLeads = safeLeads.filter(l => l.user_id === agent.id)
    const agentWonLeads = agentLeads.filter(l => l.status === 'Won')
    const agentWonValue = agentWonLeads.reduce((sum, lead) => sum + (Number(lead.expected_value) || 0), 0)
    
    return {
      ...agent,
      totalAssigned: agentLeads.length,
      wonCount: agentWonLeads.length,
      wonValue: agentWonValue,
      conversionRate: agentLeads.length > 0 ? Math.round((agentWonLeads.length / agentLeads.length) * 100) : 0
    }
  }).sort((a, b) => b.wonValue - a.wonValue) // الترتيب من الأقوى للأضعف

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50/50" dir="rtl">
      
      {/* الهيدر الاستراتيجي */}
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#0A1128] text-white flex items-center justify-center shadow-lg">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">وكالة الاستخبارات والمبيعات</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">التحليل المالي وتقييم أداء الوكلاء (Leaderboard)</p>
          </div>
        </div>
      </div>

      {/* الرادار المالي (Financial Forecast) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10"><Trophy size={120}/></div>
          <p className="text-emerald-100 font-bold text-sm mb-1 flex items-center gap-2"><DollarSign size={16}/> الأموال المحققة (Won)</p>
          <h3 className="text-3xl font-black">{totalWonValue.toLocaleString()} <span className="text-lg font-bold">ج.م</span></h3>
          <p className="text-emerald-200 text-xs mt-3 font-medium">إجمالي قيمة الصفقات المغلقة بنجاح</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10"><TrendingUp size={120}/></div>
          <p className="text-blue-100 font-bold text-sm mb-1 flex items-center gap-2"><Activity size={16}/> الأموال المحتملة (Pipeline)</p>
          <h3 className="text-3xl font-black">{totalActiveValue.toLocaleString()} <span className="text-lg font-bold">ج.م</span></h3>
          <p className="text-blue-200 text-xs mt-3 font-medium">أموال قيد التفاوض (اجتماعات ومتابعة)</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center relative overflow-hidden">
          <p className="text-slate-400 font-bold text-sm mb-1 flex items-center gap-2"><Target size={16} className="text-purple-500"/> متوسط حجم الصفقة</p>
          <h3 className="text-3xl font-black text-slate-900">{Math.round(averageDealSize).toLocaleString()} <span className="text-lg font-bold text-slate-400">ج.م</span></h3>
          <p className="text-slate-500 text-xs mt-3 font-medium">متوسط قيمة العميل الواحد عند الشراء</p>
        </div>
      </div>

      {/* لوحة الشرف والمنافسة (The Leaderboard) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            لوحة شرف الوكلاء (Top Performers)
          </h3>
        </div>

        <div className="p-6">
          {agentPerformance.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-bold">لا يوجد وكلاء مسجلين لعرض تقييمهم.</div>
          ) : (
            <div className="space-y-4">
              {agentPerformance.map((agent, index) => {
                // تحديد الميداليات للثلاثة الأوائل
                let medalColor = 'bg-slate-100 text-slate-400'
                let borderGlow = 'border-slate-100 hover:border-slate-300'
                if (index === 0) { medalColor = 'bg-amber-100 text-amber-500'; borderGlow = 'border-amber-200 bg-amber-50/10' }
                else if (index === 1) { medalColor = 'bg-slate-200 text-slate-600'; borderGlow = 'border-slate-200 bg-slate-50/50' }
                else if (index === 2) { medalColor = 'bg-orange-100 text-orange-600'; borderGlow = 'border-orange-200 bg-orange-50/10' }

                return (
                  <div key={agent.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${borderGlow}`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-lg ${medalColor}`}>
                        {index < 3 ? <Medal size={20}/> : `#${index + 1}`}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">{agent.full_name}</h4>
                        <p className="text-xs font-bold text-slate-500 mt-1">نسبة الإغلاق: {agent.conversionRate}%</p>
                      </div>
                    </div>
                    
                    <div className="text-left flex items-center gap-8">
                      <div className="hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">العملاء المفوضين</p>
                        <p className="font-bold text-slate-700 text-center">{agent.totalAssigned}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-emerald-600 mb-1">إجمالي المبيعات (Won)</p>
                        <p className="text-lg font-black text-emerald-600">{agent.wonValue.toLocaleString()} ج.م</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}