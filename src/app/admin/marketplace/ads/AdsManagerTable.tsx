'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Star, Pin, EyeOff, Eye, Tag, CheckCircle2, XCircle } from 'lucide-react'
import {
  toggleFeatureAdAction,
  togglePinAdAction,
  toggleHideAdAction,
  changeCategoryAction,
} from './actions'

export interface LiveAd {
  id: string
  title: string
  price: number
  currency: string
  property_type: string
  location: string
  status: string
  images: string[] | null
  listing_type: string | null
  is_featured: boolean
  is_featured_admin: boolean
  is_pinned: boolean
  is_hidden_admin: boolean
  admin_category: string | null
  created_at: string
  seller_name: string | null
  seller_email: string | null
}

const PROPERTY_CATEGORIES = [
  'شقة', 'فيلا', 'أرض', 'محل تجاري', 'مكتب', 'مخزن', 'منزل', 'دوبلكس', 'بنتهاوس',
]

interface Toast { type: 'success' | 'error'; text: string }

function ToggleBtn({
  active, onLabel, offLabel, icon: Icon, activeClass, onClick, disabled,
}: {
  active: boolean; onLabel: string; offLabel: string
  icon: React.ElementType; activeClass: string; onClick: () => void; disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-40 ${
        active ? activeClass : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      <Icon className="size-3.5" />
      {active ? onLabel : offLabel}
    </button>
  )
}

export function AdsManagerTable({ ads: initialAds }: { ads: LiveAd[] }) {
  const [ads, setAds] = useState(initialAds)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<Toast | null>(null)
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [categoryInput, setCategoryInput] = useState('')

  function notify(t: Toast) {
    setToast(t)
    setTimeout(() => setToast(null), 3000)
  }

  function update(id: string, patch: Partial<LiveAd>) {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  function act(fn: () => Promise<{ success: boolean; message?: string }>, patch: { id: string } & Partial<LiveAd>) {
    startTransition(async () => {
      update(patch.id, patch)
      const res = await fn()
      if (!res.success) {
        notify({ type: 'error', text: res.message ?? 'حدث خطأ' })
      } else {
        notify({ type: 'success', text: '✅ تم التحديث' })
      }
    })
  }

  return (
    <>
      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-bold shadow-2xl ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400">
              <th className="py-4 pr-4 pl-3 text-right">الإعلان</th>
              <th className="py-4 px-3 text-right">المستخدم</th>
              <th className="py-4 px-3 text-right">الفئة</th>
              <th className="py-4 px-3 text-right">السعر</th>
              <th className="py-4 px-3 text-right">الحالة</th>
              <th className="py-4 px-3 text-center">التحكم</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-50 ${pending ? 'opacity-70' : ''}`}>
            {ads.map((ad) => {
              const thumb = ad.images?.[0] ?? null
              return (
                <tr key={ad.id} className={`transition-colors hover:bg-slate-50/70 ${ad.is_hidden_admin ? 'opacity-50' : ''}`}>
                  {/* Ad */}
                  <td className="py-3 pr-4 pl-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {thumb ? (
                          <Image src={thumb} alt="" fill className="object-cover" sizes="44px" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-lg">🏠</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[160px] truncate font-bold text-slate-800">{ad.title}</p>
                        <p className="mt-0.5 max-w-[160px] truncate text-xs text-slate-400">{ad.location}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ad.is_pinned && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-600">📌 مثبت</span>}
                          {ad.is_featured_admin && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-600">⭐ مميز</span>}
                          {ad.is_hidden_admin && <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-black text-slate-500">🙈 مخفي</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* User */}
                  <td className="py-3 px-3">
                    <p className="max-w-[120px] truncate text-xs font-semibold text-slate-700">{ad.seller_name ?? '—'}</p>
                    <p className="max-w-[120px] truncate text-[10px] text-slate-400">{ad.seller_email ?? '—'}</p>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3">
                    {editCategoryId === ad.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          className="rounded-lg border border-blue-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-blue-300"
                        >
                          <option value="">بدون</option>
                          {PROPERTY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                          onClick={() => {
                            act(() => changeCategoryAction(ad.id, categoryInput), { id: ad.id, admin_category: categoryInput || null })
                            setEditCategoryId(null)
                          }}
                          className="rounded-lg bg-emerald-500 p-1 text-white hover:bg-emerald-600"
                        >
                          <CheckCircle2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setEditCategoryId(null)}
                          className="rounded-lg bg-slate-200 p-1 text-slate-600 hover:bg-slate-300"
                        >
                          <XCircle className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditCategoryId(ad.id); setCategoryInput(ad.admin_category ?? '') }}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-blue-300 hover:text-blue-600"
                      >
                        <Tag className="size-3" />
                        {ad.admin_category ?? ad.property_type ?? 'تعيين'}
                      </button>
                    )}
                  </td>

                  {/* Price */}
                  <td className="py-3 px-3 font-black text-emerald-700 text-xs">
                    {Number(ad.price).toLocaleString('ar-EG')} {ad.currency ?? 'EGP'}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      ad.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      ad.status === 'pending'  ? 'bg-amber-100 text-amber-700'   :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {ad.status}
                    </span>
                    {ad.listing_type && (
                      <span className={`mt-1 block rounded-full px-2 py-0.5 text-[10px] font-black ${
                        ad.listing_type === 'PREMIUM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {ad.listing_type}
                      </span>
                    )}
                  </td>

                  {/* Controls */}
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      <ToggleBtn
                        active={ad.is_featured_admin}
                        onLabel="مميز" offLabel="ميّز"
                        icon={Star}
                        activeClass="bg-amber-400 text-white"
                        onClick={() => act(() => toggleFeatureAdAction(ad.id, !ad.is_featured_admin), { id: ad.id, is_featured_admin: !ad.is_featured_admin })}
                        disabled={pending}
                      />
                      <ToggleBtn
                        active={ad.is_pinned}
                        onLabel="مثبت" offLabel="ثبّت"
                        icon={Pin}
                        activeClass="bg-blue-500 text-white"
                        onClick={() => act(() => togglePinAdAction(ad.id, !ad.is_pinned), { id: ad.id, is_pinned: !ad.is_pinned })}
                        disabled={pending}
                      />
                      <ToggleBtn
                        active={ad.is_hidden_admin}
                        onLabel="مخفي" offLabel="أخفِ"
                        icon={ad.is_hidden_admin ? Eye : EyeOff}
                        activeClass="bg-slate-500 text-white"
                        onClick={() => act(() => toggleHideAdAction(ad.id, !ad.is_hidden_admin), { id: ad.id, is_hidden_admin: !ad.is_hidden_admin })}
                        disabled={pending}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {ads.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">لا توجد إعلانات</div>
        )}
      </div>
    </>
  )
}
