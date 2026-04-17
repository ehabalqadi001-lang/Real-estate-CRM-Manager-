import Link from 'next/link'
import { getMyActivityBoard } from '@/domains/activities/queries'
import { Calendar, PhoneCall, MessageCircle, MapPin, CheckCircle2, Clock, ArrowLeft } from 'lucide-react'
import ActivityDoneButton from '@/components/activities/ActivityDoneButton' // سنبني هذا الزر بعد قليل

export const dynamic = 'force-dynamic'

export default async function ActivitiesPage() {
  // جلب مهام الوكيل الحالي مع بيانات العملاء
  const { pendingActivities, completedActivities } = await getMyActivityBoard()

  // أداة لاختيار الأيقونة المناسبة لنوع المهمة
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneCall size={18} className="text-blue-500" />
      case 'whatsapp': return <MessageCircle size={18} className="text-emerald-500" />
      case 'visit': return <MapPin size={18} className="text-amber-500" />
      default: return <Clock size={18} className="text-slate-500" />
    }
  }

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50/50" dir="rtl">
      
      {/* الهيدر التكتيكي */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#0A1128] text-white flex items-center justify-center shadow-lg">
            <Calendar size={28} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">مهامي اليومية والمواعيد</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">قائمة الاتصالات والاجتماعات المجدولة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* العمود الأول: المهام المطلوبة (Pending) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-amber-50 flex justify-between items-center">
            <h3 className="text-lg font-black text-amber-900 flex items-center gap-2">
              <Clock size={20} className="text-amber-600" /> قيد الانتظار ({pendingActivities.length})
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {pendingActivities.length === 0 ? (
              <p className="text-center text-slate-400 font-bold py-8">لا توجد مهام معلقة! عمل رائع.</p>
            ) : (
              pendingActivities.map((task) => (
                <div key={task.id} className="p-4 border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all bg-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-amber-400"></div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">{getActivityIcon(task.type)}</div>
                      <div>
                        <h4 className="font-black text-slate-900">{task.leads?.client_name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 font-mono" dir="ltr">{task.leads?.phone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                      {new Date(task.scheduled_at).toLocaleString('ar-EG', { hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium mb-4 bg-slate-50 p-2 rounded-lg">{task.notes || 'لا توجد ملاحظات إضافية.'}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                    <Link href={`/dashboard/leads/${task.lead_id}`} className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      ملف العميل <ArrowLeft size={14}/>
                    </Link>
                    <ActivityDoneButton activityId={task.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* العمود الثاني: المهام المنجزة (Completed) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
          <div className="p-5 border-b border-slate-100 bg-emerald-50 flex justify-between items-center">
            <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600" /> تم الإنجاز اليوم ({completedActivities.length})
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {completedActivities.length === 0 ? (
              <p className="text-center text-slate-400 font-bold py-8">سجل الإنجازات فارغ حتى الآن.</p>
            ) : (
              completedActivities.map((task) => (
                <div key={task.id} className="p-4 border border-emerald-100 rounded-xl bg-emerald-50/30 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">{getActivityIcon(task.type)}</div>
                    <div>
                      <h4 className="font-bold text-slate-700 line-through decoration-emerald-300">{task.leads?.client_name}</h4>
                      <p className="text-[10px] font-bold text-emerald-600 mt-1">أُنجزت: {new Date(task.done_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute:'2-digit' })}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="text-emerald-400" size={24} />
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
