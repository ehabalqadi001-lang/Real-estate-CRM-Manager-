import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { User, Phone, Mail, Building2, DollarSign, Clock, ArrowRight, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LeadProfilePage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // 1. جلب بيانات العميل الأساسية
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .single()

  // 2. جلب تاريخ المتابعات (التقارير) مرتبة من الأحدث للأقدم
  const { data: reports } = await supabase
    .from('lead_reports')
    .select('*, profiles(full_name)')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false })

  if (leadError || !lead) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <h2 className="text-2xl font-black text-slate-800">العميل غير موجود أو ليس لديك صلاحية للوصول إليه.</h2>
        <Link href="/dashboard/leads" className="text-blue-600 mt-4 inline-block font-bold">العودة لمسار المبيعات</Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen" dir="rtl">
      
      {/* زر العودة */}
      <Link href="/dashboard/leads" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors">
        <ArrowRight size={18} /> العودة للوحة المبيعات
      </Link>

      {/* بطاقة هوية العميل */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-black rounded-lg border border-blue-500/30">
                {lead.status}
              </span>
            </div>
            <h1 className="text-3xl font-black">{lead.client_name}</h1>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-blue-600"><Phone size={18}/></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">رقم الهاتف</p>
                <p className="font-bold">{lead.phone || 'غير مسجل'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-blue-600"><Mail size={18}/></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">البريد الإلكتروني</p>
                <p className="font-bold">{lead.email || 'غير مسجل'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-emerald-600"><Building2 size={18}/></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">الاهتمام العقاري</p>
                <p className="font-bold">{lead.property_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-emerald-600"><DollarSign size={18}/></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">القيمة المتوقعة</p>
                <p className="font-black text-emerald-600">{Number(lead.expected_value).toLocaleString()} ج.م</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* سجل المتابعات (Timeline) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
          <Activity className="text-blue-600" />
          تاريخ المتابعات والتقارير
        </h3>

        {(!reports || reports.length === 0) ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Clock size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-bold">لا يوجد أي تقارير أو متابعات مسجلة حتى الآن.</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {reports.map((report: any) => (
              <div key={report.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* النقطة المركزية */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <User size={16} />
                </div>
                
                {/* بطاقة التقرير */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-blue-600">{report.profiles?.full_name || 'وكيل مبيعات'}</span>
                    <time className="text-[10px] font-bold text-slate-400">
                      {new Date(report.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
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