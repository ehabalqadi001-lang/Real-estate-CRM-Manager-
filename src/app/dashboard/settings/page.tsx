import { Settings, ShieldCheck, Palette, Bell, Save } from 'lucide-react'
import { getCompanySettings, saveCompanySettings } from './actions'
import SettingsToggles from './SettingsToggles'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const company = await getCompanySettings()

  return (
    <div className="p-6 space-y-6 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
          <Settings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900">إعدادات النظام</h1>
          <p className="text-xs text-slate-400">هوية المؤسسة، تنبيهات الفريق، والأمان</p>
        </div>
      </div>

      {/* Branding form */}
      <form action={saveCompanySettings}>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Palette size={16} className="text-blue-600" /> هوية المؤسسة (Branding)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">اسم المؤسسة</label>
              <input name="company_name" type="text"
                defaultValue={company?.company_name ?? ''}
                placeholder="FAST INVESTMENT"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">هاتف الدعم</label>
              <input name="phone" type="tel" dir="ltr"
                defaultValue={company?.phone ?? ''}
                placeholder="+201XXXXXXXXX"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 font-bold text-right" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">اسم المسؤول</label>
              <input name="full_name" type="text"
                defaultValue={company?.full_name ?? ''}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 font-bold" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
              <Save size={15} /> حفظ التغييرات
            </button>
          </div>
        </div>
      </form>

      {/* Toggles (client component) */}
      <SettingsToggles />

      {/* Security panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
        <h2 className="font-black mb-5 flex items-center gap-2 border-b border-slate-800 pb-4">
          <ShieldCheck size={16} className="text-emerald-400" /> الأمان والصلاحيات
        </h2>
        <div className="space-y-3">
          <p className="text-xs text-slate-400 bg-white/5 rounded-xl p-4 border border-white/10 leading-relaxed">
            أنت تمتلك صلاحيات <strong className="text-white">المدير الكامل</strong>. يمكنك تعديل العمولات، حذف الصفقات، وإدارة الفريق.
          </p>
          <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10">
            تغيير كلمة المرور
          </button>
          <button className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold transition-all border border-emerald-500/20">
            تفعيل المصادقة الثنائية (2FA)
          </button>
        </div>
      </div>
    </div>
  )
}
