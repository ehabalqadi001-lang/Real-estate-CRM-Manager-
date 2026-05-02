import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { User, Phone, Mail, Building2, DollarSign, Clock, ArrowRight, Activity, AlertTriangle } from 'lucide-react'
import AddActivityButton from '@/components/leads/AddActivityButton'
import ActivityTimeline from '@/components/leads/ActivityTimeline'
import SendWhatsAppButton from '@/components/leads/SendWhatsAppButton'
import UpdateLeadPanel from './UpdateLeadPanel'
import { scoreColor, scoreLabel } from '../score-utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeadProfilePage({ params }: PageProps) {
  // 2. فك التشفير الآمن لرابط العميل
  const { id: leadId } = await params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 3. المحرك المزدوج: جلب هوية العميل + تاريخه التفاوضي في نفس الوقت
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  const [{ data: reports }, { data: activities }] = await Promise.all([
    supabase
      .from('lead_reports')
      .select('*, profiles(full_name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false }),
    supabase
      .from('lead_activities')
      .select('*, profiles(full_name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false }),
  ])

  // 4. درع الأخطاء الفولاذي (في حالة الرفض الأمني أو حذف العميل)
  if (leadError || !lead) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-4 sm:p-8 text-center" dir="rtl">
        <div className="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200 max-w-lg w-full shadow-lg">
          <AlertTriangle className="mx-auto text-amber-500 mb-6" size={64} />
          <h2 className="text-2xl font-black text-slate-900 mb-3">عذراً، لا يمكن الوصول لسجل هذا العميل</h2>
          <p className="text-slate-600 mb-6 font-medium leading-relaxed">
            قد يكون العميل غير موجود في قاعدة البيانات، أو أن الجدار الأمني (RLS) يمنع حسابك من عرض بيانات تخص شركة أخرى.
          </p>
          
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-8 text-right">
            <p className="text-[10px] font-bold text-slate-400 mb-1">التقرير التشخيصي (للمدير التقني):</p>
            <p className="text-xs font-mono text-slate-600" dir="ltr">
              {leadError?.message || "Error: PGRST116 - Row not found or access denied."}
            </p>
          </div>

          <Link 
            href="/dashboard/leads" 
            className="bg-[#0A1128] hover:bg-[#152042] text-white px-4 sm:px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-md"
          >
            العودة لمسار المبيعات <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    )
  }

  // 5. واجهة سجل العميل (The Lead Profile UI)
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-slate-50/50" dir="rtl">
      
      {/* شريط الملاحة العلوي */}
      <div className="flex justify-between items-center">
        <Link href="/dashboard/leads" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <ArrowRight size={18} /> مسار المبيعات
        </Link>
        <span className="text-xs font-bold text-slate-400 font-mono">ID: {lead.id.split('-')[0]}...</span>
      </div>

      {/* بطاقة الهوية الذكية */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-l from-[#0A1128] to-[#152042] p-4 sm:p-8 text-white relative overflow-hidden">
          {/* زخرفة بصرية */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="px-3 py-1 bg-white/10 text-blue-300 text-xs font-black rounded-lg border border-white/20 backdrop-blur-sm">
                حالة العميل: {lead.status}
              </span>
              {lead.score != null && lead.score > 0 && (
                <span className={`px-3 py-1 text-xs font-black rounded-lg border ${scoreColor(lead.score)}`}>
                  {lead.score} نقطة · {scoreLabel(lead.score)}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black">{lead.client_name}</h1>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
          {/* بيانات الاتصال */}
          <div className="space-y-5 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 mb-4">بيانات التواصل</h3>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 text-blue-600"><Phone size={18}/></div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400">رقم الهاتف الأساسي</p>
                <p className="font-bold text-md" dir="ltr">{lead.phone || 'غير مسجل'}</p>
              </div>
              {lead.phone && (
                <SendWhatsAppButton
                  leadId={leadId}
                  phone={lead.phone}
                  leadName={lead.client_name || lead.full_name || 'عميل'}
                />
              )}
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 text-blue-600"><Mail size={18}/></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">البريد الإلكتروني</p>
                <p className="font-bold text-md">{lead.email || 'غير مسجل'}</p>
              </div>
            </div>
          </div>

          {/* التقييم المالي والعقاري */}
          <div className="space-y-5 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 mb-4">الهدف الاستثماري</h3>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 text-emerald-600"><Building2 size={18}/></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">نوع العقار المطلوب</p>
                <p className="font-bold text-md">{lead.property_type || 'غير محدد'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 text-emerald-600"><DollarSign size={18}/></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">حجم الصفقة المتوقع</p>
                <p className="font-black text-lg text-emerald-600">{Number(lead.expected_value).toLocaleString()} ج.م</p>
              </div>
            </div>
          </div>
          <UpdateLeadPanel
            leadId={leadId}
            currentStatus={lead.status}
            currentTemp={lead.temperature}
            currentValue={lead.expected_value ? Number(lead.expected_value) : null}
          />
        </div>
      </div>

      {/* سجل الأنشطة */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Activity className="text-[#00C27C]" size={20} />
            سجل الأنشطة
          </h3>
          <AddActivityButton leadId={leadId} />
        </div>
        <ActivityTimeline activities={activities ?? []} />
      </div>

      {/* الجدول الزمني للمفاوضات (Timeline) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-8 border-b border-slate-100 pb-4">
          <Activity className="text-blue-600" />
          الصندوق الأسود (تاريخ التقارير)
        </h3>

        {(!reports || reports.length === 0) ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock size={40} className="mx-auto text-slate-300 mb-4" />
            <h4 className="text-lg font-black text-slate-700 mb-1">لا يوجد سجلات سابقة</h4>
            <p className="text-sm text-slate-500 font-medium">لم يتم إضافة أي تقارير متابعة لهذا العميل حتى الآن من قبل فريق المبيعات.</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {reports.map((report) => (
              <div key={report.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-50 text-blue-600 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <User size={16} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-3">
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                      {report.profiles?.full_name || 'وكيل مبيعات (FAST INVESTMENT)'}
                    </span>
                    <time className="text-[11px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-md shadow-sm">
                      {new Date(report.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </time>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {report.report_text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
