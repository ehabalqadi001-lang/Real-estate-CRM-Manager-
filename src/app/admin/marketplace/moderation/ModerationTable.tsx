'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { CheckCircle2, XCircle, FileEdit, AlertCircle, X, ChevronDown } from 'lucide-react'
import { approveAdAction, rejectAdAction, requestEditAction } from './actions'

export interface PendingAd {
  id: string
  title: string
  price: number
  currency: string
  property_type: string
  location: string
  images: string[] | null
  is_urgent: boolean
  created_at: string
  status: string
  user_id: string
  seller_email: string | null
  seller_name: string | null
}

interface Toast { type: 'success' | 'error'; text: string }

export function ModerationTable({ ads: initialAds }: { ads: PendingAd[] }) {
  const [ads, setAds] = useState(initialAds)
  const [pending, startTransition] = useTransition()
  const [modal, setModal] = useState<'reject' | 'edit' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [toast, setToast] = useState<Toast | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function notify(t: Toast) {
    setToast(t)
    setTimeout(() => setToast(null), 3500)
  }

  function removeAd(id: string) {
    setAds((prev) => prev.filter((a) => a.id !== id))
  }

  function openModal(type: 'reject' | 'edit', id: string) {
    setSelectedId(id)
    setInputText('')
    setModal(type)
  }

  function closeModal() {
    setModal(null)
    setSelectedId(null)
    setInputText('')
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const res = await approveAdAction(id)
      if (res.success) {
        removeAd(id)
        notify({ type: 'success', text: '✅ تمت الموافقة على الإعلان بنجاح' })
      } else {
        notify({ type: 'error', text: res.message ?? 'حدث خطأ' })
      }
    })
  }

  function handleModalSubmit() {
    if (!selectedId || !inputText.trim()) return
    startTransition(async () => {
      const res = modal === 'reject'
        ? await rejectAdAction(selectedId, inputText)
        : await requestEditAction(selectedId, inputText)
      if (res.success) {
        removeAd(selectedId)
        closeModal()
        notify({
          type: 'success',
          text: modal === 'reject' ? '🚫 تم رفض الإعلان' : '✏️ تم إرسال طلب التعديل',
        })
      } else {
        notify({ type: 'error', text: res.message ?? 'حدث خطأ' })
      }
    })
  }

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 py-20 text-center">
        <CheckCircle2 className="mb-4 size-14 text-emerald-400" />
        <p className="text-xl font-black text-emerald-700">لا توجد إعلانات معلقة</p>
        <p className="mt-1 text-sm text-emerald-500">تمت مراجعة جميع الإعلانات</p>
      </div>
    )
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-bold shadow-2xl transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400">
              <th className="py-4 pl-4 pr-4 text-right">الإعلان</th>
              <th className="py-4 px-3 text-right">المستخدم</th>
              <th className="py-4 px-3 text-right">النوع</th>
              <th className="py-4 px-3 text-right">السعر</th>
              <th className="py-4 px-3 text-right">التاريخ</th>
              <th className="py-4 px-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ads.map((ad) => {
              const thumb = ad.images?.[0] ?? null
              const isExpanded = expandedId === ad.id
              return (
                <>
                  <tr
                    key={ad.id}
                    className={`transition-colors hover:bg-slate-50/80 ${pending ? 'opacity-60' : ''}`}
                  >
                    {/* Ad thumbnail + title */}
                    <td className="py-3 pl-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {thumb ? (
                            <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-300">🏠</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate font-bold text-slate-800">{ad.title}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{ad.location}</p>
                          {ad.is_urgent && (
                            <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600">عاجل</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* User */}
                    <td className="py-3 px-3">
                      <p className="max-w-[140px] truncate font-semibold text-slate-700">{ad.seller_name ?? '—'}</p>
                      <p className="truncate text-xs text-slate-400">{ad.seller_email ?? ad.user_id.slice(0, 8)}</p>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {ad.property_type ?? 'عقار'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 font-black text-emerald-700">
                      {Number(ad.price).toLocaleString('ar-EG')} {ad.currency ?? 'EGP'}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-xs text-slate-400" dir="ltr">
                      {new Date(ad.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleApprove(ad.id)}
                          disabled={pending}
                          title="موافقة"
                          className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 disabled:opacity-40"
                        >
                          <CheckCircle2 className="size-3.5" />
                          موافقة
                        </button>
                        <button
                          onClick={() => openModal('edit', ad.id)}
                          disabled={pending}
                          title="طلب تعديل"
                          className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-blue-600 active:scale-95 disabled:opacity-40"
                        >
                          <FileEdit className="size-3.5" />
                          تعديل
                        </button>
                        <button
                          onClick={() => openModal('reject', ad.id)}
                          disabled={pending}
                          title="رفض"
                          className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-red-600 active:scale-95 disabled:opacity-40"
                        >
                          <XCircle className="size-3.5" />
                          رفض
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : ad.id)}
                          title="تفاصيل"
                          className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                        >
                          <ChevronDown className={`size-3.5 transition ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded details row */}
                  {isExpanded && (
                    <tr key={`${ad.id}-detail`} className="bg-blue-50/40">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                          <div><span className="font-black text-slate-400">ID الإعلان: </span><span dir="ltr" className="font-mono">{ad.id}</span></div>
                          <div><span className="font-black text-slate-400">ID المستخدم: </span><span dir="ltr" className="font-mono">{ad.user_id}</span></div>
                          <div><span className="font-black text-slate-400">الحالة: </span><span className="font-bold">{ad.status}</span></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Backdrop */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 rounded-2xl bg-white p-4 sm:p-6 shadow-2xl">
            {/* Modal header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {modal === 'reject' ? (
                  <XCircle className="size-5 text-red-500" />
                ) : (
                  <FileEdit className="size-5 text-blue-500" />
                )}
                <h3 className="text-base font-black text-slate-800">
                  {modal === 'reject' ? 'رفض الإعلان' : 'طلب تعديل'}
                </h3>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="size-4" />
              </button>
            </div>

            <div className="mb-1 flex items-center gap-1.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <AlertCircle className="size-4 shrink-0" />
              {modal === 'reject'
                ? 'سيتم إشعار المستخدم بسبب الرفض'
                : 'سيتم إرسال ملاحظاتك إلى المستخدم لتعديل الإعلان'}
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={modal === 'reject' ? 'اكتب سبب الرفض بوضوح...' : 'اكتب ملاحظات التعديل المطلوبة...'}
              rows={4}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              dir="rtl"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleModalSubmit}
                disabled={pending || !inputText.trim()}
                className={`flex-1 rounded-xl py-2.5 text-sm font-black text-white transition active:scale-95 disabled:opacity-40 ${
                  modal === 'reject' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {pending ? 'جاري الإرسال...' : modal === 'reject' ? 'تأكيد الرفض' : 'إرسال ملاحظات'}
              </button>
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
