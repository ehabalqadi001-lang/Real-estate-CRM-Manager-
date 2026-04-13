import { getDashboardStats } from './actions'
import { Wallet, Users, Building2, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react'
import CRMAnalyticsVisualizer from '@/components/dashboard/CRMAnalyticsVisualizer'
export const dynamic = 'force-dynamic'

export default async function DashboardHome() {
  let stats: any = null
  let fetchError = null
  let exactErrorDetails = null

  try {
    stats = await getDashboardStats()
  } catch (e: any) {
    fetchError = "تعذر تحميل ملخص البيانات الإحصائية."
    exactErrorDetails = e.message || "Database Connection Error"
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* الترحيب الإداري */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">نظرة عامة على الأداء</h1>
          <p className="text-slate-500 mt-1">مرحباً بك مجدداً، إليك ملخص العمليات الحالية</p>
        </div>
        <div className="text-left text-xs font-bold text-slate-400">
          تحديث تلقائي: {new Date().toLocaleTimeString('ar-EG')}
        </div>
      </div>

      {/* صائد الأخطاء القياسي */}
      {fetchError ? (
        <div className="bg-white rounded-3xl border-2 border-red-50 p-12 text-center shadow-sm">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertTriangle size={32} />
          </div>
          <p className="text-red-600 font-bold text-lg">{fetchError}</p>
          <code className="mt-4 block bg-slate-50 p-2 rounded text-xs font-mono text-slate-500" dir="ltr">
            {exactErrorDetails}
          </code>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* كارت المبيعات */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
            <Wallet className="text-emerald-600 mb-4 relative z-10" size={28} />
            <p className="text-slate-500 text-xs font-bold relative z-10">إجمالي قيمة المبيعات (Won)</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10">
              {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(stats.totalSales)}
            </h3>
            <div className="mt-4 flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
              <TrendingUp size={12} /> +12% مقارنة بالشهر الماضي
            </div>
          </div>

          {/* كارت العملاء المحتملين */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
            <Users className="text-blue-600 mb-4 relative z-10" size={28} />
            <p className="text-slate-500 text-xs font-bold relative z-10">العملاء النشطون (Pipeline)</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10">{stats.leadStats.total} عميل</h3>
            <div className="mt-4 flex gap-2">
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">جديد: {stats.leadStats.fresh}</span>
              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">اجتماع: {stats.leadStats.meeting}</span>
            </div>
          </div>

          {/* كارت المخزون */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-110 transition-transform"></div>
            <Building2 className="text-slate-900 mb-4 relative z-10" size={28} />
            <p className="text-slate-500 text-xs font-bold relative z-10">الوحدات المتاحة للبيع</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10">{stats.invStats.available} وحدة</h3>
            <div className="mt-4 text-[10px] text-slate-400 font-bold">من أصل {stats.invStats.available + stats.invStats.sold} وحدة إجمالاً</div>
          </div>

          {/* كارت التنبيهات (Critical) */}
          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full group-hover:scale-110 transition-transform"></div>
            <AlertTriangle className="text-amber-400 mb-4 relative z-10" size={28} />
            <p className="text-slate-400 text-xs font-bold relative z-10">متابعات فائتة (AI Alerts)</p>
            <h3 className="text-2xl font-black text-white mt-1 relative z-10">{stats.overdueCount} تنبيه</h3>
            <div className="mt-4 flex items-center gap-1 text-amber-400 text-[10px] font-bold">
              تطلب تدخل فوري من فريق المبيعات
            </div>
          </div>
        </div>
      )}

      {/* الرسوم البيانية التفاعلية للتحليل الإحصائي */}
      {!fetchError && (
        <div className="mt-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-800">تحليل مؤشرات الأداء (KPIs Explorer)</h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interactive Analytics</span>
           </div>
           <CRMAnalyticsVisualizer stats={stats} />
        </div>
      )}
    </div>
  )
}