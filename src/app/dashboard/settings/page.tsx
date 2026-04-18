import { Settings, ShieldCheck, Palette, Save } from 'lucide-react'
import { getCompanySettings, saveCompanySettings } from './actions'
import SettingsToggles from './SettingsToggles'
import ChangePasswordDialog from './ChangePasswordDialog'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const company = await getCompanySettings()

  return (
    <div className="max-w-4xl space-y-5 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
          <Settings size={18} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[var(--fi-ink)]">إعدادات النظام</h1>
          <p className="text-xs text-[var(--fi-muted)]">هوية المؤسسة · تنبيهات الفريق · الأمان</p>
        </div>
      </div>

      {/* Branding form */}
      <form action={saveCompanySettings}>
        <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 border-b border-[var(--fi-line)] pb-4 font-black text-[var(--fi-ink)]">
            <Palette size={16} className="text-blue-600" aria-hidden="true" /> هوية المؤسسة
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="company_name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--fi-muted)]">اسم المؤسسة</label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                defaultValue={company?.company_name ?? ''}
                placeholder="FAST INVESTMENT"
                className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2.5 text-sm font-bold text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--fi-muted)]">هاتف الدعم</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                dir="ltr"
                defaultValue={company?.phone ?? ''}
                placeholder="+201XXXXXXXXX"
                className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2.5 text-sm font-bold text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="full_name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--fi-muted)]">اسم المسؤول</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={company?.full_name ?? ''}
                className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2.5 text-sm font-bold text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[var(--fi-emerald)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Save size={14} aria-hidden="true" /> حفظ التغييرات
            </button>
          </div>
        </div>
      </form>

      {/* Notification Toggles — persisted to DB */}
      <SettingsToggles initialPrefs={company?.notification_prefs as Record<string, boolean> | null} />

      {/* Security panel */}
      <div className="rounded-2xl bg-[#0B1120] p-5 text-white shadow-xl">
        <h2 className="mb-5 flex items-center gap-2 border-b border-white/10 pb-4 font-black">
          <ShieldCheck size={16} className="text-[var(--fi-emerald)]" aria-hidden="true" /> الأمان والصلاحيات
        </h2>
        <div className="space-y-3">
          <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-400">
            أنت تمتلك صلاحيات <strong className="text-white">المدير الكامل</strong>. يمكنك تعديل العمولات، حذف الصفقات، وإدارة الفريق.
          </p>
          <ChangePasswordDialog />
          <button
            type="button"
            className="w-full cursor-not-allowed rounded-xl border border-[var(--fi-emerald)]/20 bg-[var(--fi-emerald)]/10 py-2.5 text-sm font-bold text-[var(--fi-emerald)] opacity-60"
            title="قريباً"
          >
            تفعيل المصادقة الثنائية (2FA) — قريباً
          </button>
        </div>
      </div>
    </div>
  )
}
