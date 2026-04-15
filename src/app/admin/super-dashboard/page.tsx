import { Globe, Building2, Users, Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperDashboard() {
  return (
    <div className="space-y-8 w-full">
      {/* الهيدر باللون الكحلي والذهبي */}
      <div className="flex items-center gap-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="h-16 w-16 rounded-2xl bg-navy text-white flex items-center justify-center shadow-lg">
          <Globe size={32} className="text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-navy-dark">لوحة التحكم الإدارية الكبرى</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">مرحباً بك يا قائد، إليك ملخص أداء المنصة بالكامل</p>
        </div>
      </div>

      {/* شبكة الإحصائيات بألوان الدستور التقني */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* بطاقة الكحلي (Navy) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-r-4 border-r-navy">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-2">إجمالي الشركات المسجلة</p>
              <h3 className="text-4xl font-black text-navy-dark">0</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Building2 size={24} className="text-navy" />
            </div>
          </div>
        </div>

        {/* بطاقة الزمردي (Teal) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-r-4 border-r-teal">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-2">إجمالي الوكلاء</p>
              <h3 className="text-4xl font-black text-teal">1</h3>
            </div>
            <div className="p-3 bg-teal/10 rounded-xl border border-teal/20">
              <Users size={24} className="text-teal" />
            </div>
          </div>
        </div>

        {/* بطاقة الذهبي (Gold) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-r-4 border-r-gold">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-2">حجم المبيعات</p>
              <h3 className="text-4xl font-black text-gold">0</h3>
            </div>
            <div className="p-3 bg-gold/10 rounded-xl border border-gold/20">
              <Wallet size={24} className="text-gold" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}