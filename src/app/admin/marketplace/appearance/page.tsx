import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Paintbrush, Plus, ArrowUp, ArrowDown, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  addTickerItemAction,
  toggleTickerItemAction,
  deleteTickerItemAction,
  reorderTickerItemAction,
} from './actions'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  text: '📝 نص',
  logo: '🏢 شعار مطور',
  launch: '🚀 إطلاق جديد',
}

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-100 text-blue-700',
  logo: 'bg-purple-100 text-purple-700',
  launch: 'bg-amber-100 text-amber-700',
}

export default async function AppearancePage() {
  await requirePermission('platform.manage')
  const supabase = await createRawClient()

  const { data: items } = await supabase
    .from('marketplace_ticker')
    .select('id,type,content,logo_url,developer_name,badge_color,is_active,display_order,created_at')
    .order('display_order')

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-l from-pink-600 via-rose-500 to-orange-500 p-4 sm:p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
            <Paintbrush className="size-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white/70">Marketplace CPanel</p>
            <h1 className="text-2xl font-black">الواجهة والمظهر</h1>
            <p className="mt-1 text-sm text-white/70">
              أدِر شريط الإعلانات المتحرك — أضف شعارات المطورين وتنبيهات الإطلاقات الجديدة
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Current Ticker Items */}
        <section className="space-y-3">
          <h2 className="font-black text-slate-700">عناصر الشريط المتحرك ({(items ?? []).length})</h2>

          {(items ?? []).length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
              <Paintbrush className="mb-3 size-10 text-slate-300" />
              <p className="font-bold text-slate-400">لا توجد عناصر بعد — أضف أول عنصر</p>
            </div>
          )}

          {(items ?? []).map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                item.is_active
                  ? 'border-slate-200 bg-white shadow-sm'
                  : 'border-slate-100 bg-slate-50 opacity-60'
              }`}
            >
              {/* Logo preview */}
              {item.type === 'logo' && item.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.logo_url} alt={item.developer_name ?? ''} className="size-12 rounded-lg object-contain border border-slate-100 bg-white p-1" />
              ) : (
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: item.badge_color + '22' }}
                >
                  {item.type === 'launch' ? '🚀' : item.type === 'logo' ? '🏢' : '📝'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${TYPE_COLORS[item.type]}`}>
                    {TYPE_LABELS[item.type]}
                  </span>
                  <span className="text-xs text-slate-400">ترتيب #{item.display_order}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-700">
                  {item.content ?? item.developer_name ?? '—'}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <form action={reorderTickerItemAction.bind(null, item.id, 'up') as unknown as (fd: FormData) => Promise<void>}>
                  <button type="submit" disabled={idx === 0} title="تحريك لأعلى" className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 disabled:opacity-30">
                    <ArrowUp className="size-3.5" />
                  </button>
                </form>
                <form action={reorderTickerItemAction.bind(null, item.id, 'down') as unknown as (fd: FormData) => Promise<void>}>
                  <button type="submit" disabled={idx === (items?.length ?? 0) - 1} title="تحريك لأسفل" className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 disabled:opacity-30">
                    <ArrowDown className="size-3.5" />
                  </button>
                </form>
                <form action={toggleTickerItemAction.bind(null, item.id, !item.is_active) as unknown as (fd: FormData) => Promise<void>}>
                  <button type="submit" title={item.is_active ? 'إخفاء' : 'إظهار'} className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600">
                    {item.is_active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </form>
                <form action={deleteTickerItemAction.bind(null, item.id) as unknown as (fd: FormData) => Promise<void>}>
                  <button type="submit" title="حذف" className="flex size-7 items-center justify-center rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="size-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </section>

        {/* Add new item form */}
        <section>
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="size-4 text-emerald-500" />
              <h2 className="font-black text-slate-700">إضافة عنصر جديد</h2>
            </div>

            <form action={addTickerItemAction as unknown as (fd: FormData) => Promise<void>} className="space-y-3">
              {/* Type */}
              <div>
                <label className="mb-1 block text-xs font-black text-slate-500">النوع</label>
                <select
                  name="type"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="text">📝 نص عام</option>
                  <option value="logo">🏢 شعار مطور</option>
                  <option value="launch">🚀 إطلاق جديد</option>
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="mb-1 block text-xs font-black text-slate-500">النص / اسم المطور</label>
                <input
                  name="content"
                  type="text"
                  placeholder="اكتب نص الشريط أو اسم المطور..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Developer name (for logo type) */}
              <div>
                <label className="mb-1 block text-xs font-black text-slate-500">اسم المطور (لنوع الشعار)</label>
                <input
                  name="developer_name"
                  type="text"
                  placeholder="اسم الشركة المطورة"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Logo upload */}
              <div>
                <label className="mb-1 block text-xs font-black text-slate-500">رفع الشعار (PNG/SVG/JPG)</label>
                <input
                  name="logo_file"
                  type="file"
                  accept="image/*"
                  className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-blue-700 hover:border-blue-300"
                />
              </div>

              {/* Badge color */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-black text-slate-500">لون البادج</label>
                <input
                  name="badge_color"
                  type="color"
                  defaultValue="#10b981"
                  className="size-9 cursor-pointer rounded-lg border border-slate-200"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-black text-white shadow-md transition hover:from-emerald-600 hover:to-teal-600 active:scale-95"
              >
                <Plus className="size-4" />
                إضافة للشريط
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Live Preview */}
      <section>
        <h2 className="mb-3 font-black text-slate-700">معاينة الشريط المتحرك</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#050816] py-3 shadow-sm">
          <div className="flex gap-8 overflow-hidden whitespace-nowrap" style={{ animation: 'ticker-scroll 20s linear infinite' }}>
            {(items ?? []).filter((i) => i.is_active).map((item) => (
              <span key={item.id} className="inline-flex items-center gap-2 text-sm font-bold text-white">
                {item.type === 'logo' && item.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.logo_url} alt="" className="inline size-5 rounded object-contain" />
                )}
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-black text-white"
                  style={{ backgroundColor: item.badge_color }}
                >
                  {item.type === 'launch' ? '🚀 جديد' : item.type === 'logo' ? '🏢' : '📢'}
                </span>
                {item.content ?? item.developer_name}
              </span>
            ))}
            {!(items ?? []).filter((i) => i.is_active).length && (
              <span className="text-sm text-white/40">لا توجد عناصر نشطة</span>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
