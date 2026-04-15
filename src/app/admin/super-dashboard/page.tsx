import { Globe, Building2, Users, Wallet } from 'lucide-react'

// تمت إضافة force-dynamic لضمان تحديث الأرقام اللحظي إذا تم ربطها بقاعدة البيانات
export const dynamic = 'force-dynamic'

export default async function SuperDashboard() {
  
  // ملاحظة للقائد: يمكنك إضافة أكواد جلب البيانات (Supabase Fetching) هنا مستقبلاً
  // احتفظنا بالقيم الحالية (0 شركة، 1 وكيل، 0 مبيعات) كما ظهرت في تقريرك للحفاظ على البناء السابق

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50/50 w-full" dir="rtl">
      
      {/* 1. الهيدر الاستراتيجي للقيادة */}
      <div className="flex items-center gap-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="h-16 w-16 rounded-2xl bg-navy text-white flex items-center justify-center shadow-lg">
          <Globe size={32} className="text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-navy-dark">لوحة التحكم الإدارية الكبرى</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">مرحباً بك يا قائد، إليك ملخص أداء المنصة بالكامل (Super Admin View)</p>
        </div>
      </div>

      {/* 2. شبكة الإحصائيات (Grid System) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* بطاقة إجمالي الشركات */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-r-4 border-r-navy hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-2">إجمالي الشركات المسجلة</p>
              <h3 className="text-4xl font-black text-navy-dark flex items-baseline gap-2">
                0 <span className="text-base font-bold text-slate-400">شركة</span>
              </h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Building2 size={24} className="text-navy" />
            </div>
          </div>
        </div>

        {/* بطاقة إجمالي الوكلاء */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-r-4 border-r-teal hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-2">إجمالي الوكلاء (Agents)</p>
              <h3 className="text-4xl font-black text-teal flex items-baseline gap-2">
                1 <span className="text-base font-bold text-slate-400">وكيل</span>
              </h3>
            </div>
            <div className="p-3 bg-teal/10 rounded-xl border border-teal/20">
              <Users size={24} className="text-teal" />
            </div>
          </div>
        </div>

        {/* بطاقة حجم المبيعات */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-r-4 border-r-gold hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-2">حجم مبيعات المنصة (EGP)</p>
              <h3 className="text-4xl font-black text-gold flex items-baseline gap-2">
                0 <span className="text-base font-bold text-slate-400">ج.م</span>
              </h3>
            </div>
            <div className="p-3 bg-gold/10 rounded-xl border border-gold/20">
              <Wallet size={24} className="text-gold" />
            </div>
          </div>
        </div>

      </div>

      {/* 3. منطقة توسعية مستقبلية (Placeholder) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center justify-center opacity-60">
        <Globe size={48} className="text-slate-300 mb-4" />
        <h4 className="text-lg font-black text-slate-400">منطقة التقارير التحليلية</h4>
        <p className="text-sm text-slate-400 mt-2">سيتم ربط المخططات البيانية (Charts) هنا في المراحل القادمة.</p>
      </div>

    </div>
  )
}