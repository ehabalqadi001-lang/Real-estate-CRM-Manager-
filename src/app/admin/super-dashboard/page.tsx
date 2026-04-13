import { getSuperStats, createAnnouncement } from './actions'
import { Globe, Users, Building, Wallet, Megaphone, AlertTriangle, PlusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperDashboardPage() {
  let stats: any = null
  let fetchError = null
  let exactErrorDetails = null

  try {
    stats = await getSuperStats()
  } catch (e: any) {
    fetchError = "تعذر تحميل إحصائيات المنصة العالمية."
    exactErrorDetails = e.message || "Connection Error"
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* هيدر الإدارة العليا */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Globe className="text-emerald-600" /> لوحة التحكم الإدارية الكبرى
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-bold">مرحباً بك يا قائد، إليك ملخص أداء المنصة بالكامل</p>
        </div>
      </div>

      {/* صائد الأخطاء القياسي */}
      {fetchError ? (
        <div className="bg-white rounded-3xl border-2 border-red-50 p-12 text-center shadow-sm">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-bold">{fetchError}</p>
          <code className="mt-2 block text-xs font-mono text-slate-400" dir="ltr">{exactErrorDetails}</code>
        </div>
      ) : (
        <>
          {/* البطاقات الإحصائية الكبرى */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <Building className="text-blue-600 mb-4" />
              <p className="text-slate-500 text-xs font-bold">إجمالي الشركات المسجلة</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.companiesCount} شركة</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <Users className="text-purple-600 mb-4" />
              <p className="text-slate-500 text-xs font-bold">إجمالي الوكلاء (Agents)</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.usersCount} وكيل</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <Wallet className="text-emerald-600 mb-4" />
              <p className="text-slate-500 text-xs font-bold">حجم مبيعات المنصة (EGP)</p>
              <h3 className="text-2xl font-black text-slate-900">
                {new Intl.NumberFormat('ar-EG').format(stats.totalGlobalSales)}
              </h3>
            </div>
          </div>

          {/* نظام إضافة الإعلانات */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border border-slate-800">
             <div className="flex items-center gap-3 mb-6">
                <Megaphone className="text-amber-400" />
                <h3 className="text-lg font-bold">بث إعلان إداري (Announcement)</h3>
             </div>
             <form action={createAnnouncement} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input name="title" required placeholder="عنوان الإعلان (مثلاً: تحديث نظام العمولات)" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" />
                  <textarea name="body" required placeholder="نص الإعلان التفصيلي..." rows={3} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400" />
                </div>
                <div className="space-y-4">
                  <select name="target_audience" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold outline-none">
                    <option value="all">الكل (All Users)</option>
                    <option value="companies">الشركات فقط</option>
                    <option value="individuals">الأفراد فقط</option>
                  </select>
                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                    <PlusCircle size={18} /> بث الإعلان الآن
                  </button>
                </div>
             </form>
          </div>
        </>
      )}
    </div>
  )
}