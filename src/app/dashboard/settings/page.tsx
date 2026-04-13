import { Settings, ShieldCheck, Palette, Bell, Save, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  let fetchError = null
  let exactErrorDetails = null

  try {
    // هنا سيتم مستقبلاً جلب إعدادات النظام من جدول (system_settings) في Supabase
  } catch (e: any) {
    fetchError = "تعذر تحميل إعدادات النظام الحالية."
    exactErrorDetails = e.message
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الهيدر القياسي */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-slate-700" /> إعدادات النظام (System Settings)
          </h1>
          <p className="text-sm text-slate-500 mt-1">تخصيص الهوية البصرية، الصلاحيات، وتنبيهات AI</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-slate-900/20">
          <Save size={18} /> حفظ التغييرات
        </button>
      </div>

      {/* صائد الأخطاء */}
      {fetchError ? (
        <div className="bg-white rounded-3xl border-2 border-red-50 p-12 text-center shadow-sm">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-bold">{fetchError}</p>
          <code className="mt-2 block text-xs font-mono text-slate-400" dir="ltr">{exactErrorDetails}</code>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* القسم الأول: الهوية والبراندنج */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-4">
                <Palette className="text-blue-600" size={20} /> هوية المؤسسة (Branding)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">اسم المؤسسة</label>
                  <input type="text" defaultValue="FAST INVESTMENT" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">شعار النظام (Logo Text)</label>
                  <input type="text" defaultValue="Enterprise CRM" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold outline-none bg-slate-50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">البريد الرسمي للدعم</label>
                  <input type="email" placeholder="support@fast-investment.com" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold outline-none bg-slate-50 text-left" dir="ltr" />
                </div>
              </div>
            </div>

            {/* القسم الثاني: تنبيهات AI Calendar */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-4">
                <Bell className="text-amber-500" size={20} /> إعدادات التنبيهات الذكية
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800">تنبيهات المتابعة المتأخرة</p>
                    <p className="text-xs text-slate-500">إرسال تنبيه فوري للقائد عند تأخر السيلز في مكالمة العميل</p>
                  </div>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                </div>
              </div>
            </div>
          </div>

          {/* القسم الجانبي: الأمان والصلاحيات */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border border-slate-800">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                <ShieldCheck className="text-emerald-400" size={20} /> الأمان والصلاحيات
              </h3>
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs leading-relaxed text-slate-400">
                  <strong className="text-white block mb-1">صلاحية المدير:</strong>
                  أنت تمتلك صلاحيات "القائد الإداري" الكاملة. يمكنك تعديل العمولات، حذف الصفقات، وإدارة الفريق بالكامل.
                </div>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10">
                  تغيير كلمة المرور
                </button>
                <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-all border border-red-500/20">
                  تفعيل الحماية الثنائية (2FA)
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}