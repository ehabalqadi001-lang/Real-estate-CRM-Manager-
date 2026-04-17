'use client'

import { useState, useTransition } from 'react'
import { Clock, X, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { createReservation, cancelReservation } from './reserve-action'

interface Props {
  unitId: string
  isReserved?: boolean
  reservedFor?: string | null
  expiresAt?: string | null
}

export default function ReserveButton({ unitId, isReserved, reservedFor, expiresAt }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  function handleReserve(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createReservation(
        unitId,
        fd.get('client_name') as string,
        fd.get('client_phone') as string,
      )
      setFeedback({ ok: result.ok, msg: result.ok ? 'تم الحجز بنجاح لمدة 48 ساعة' : result.error ?? 'حدث خطأ' })
      if (result.ok) setTimeout(() => { setOpen(false); setFeedback(null) }, 1500)
    })
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelReservation(unitId)
    })
  }

  if (isReserved) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold">
          <Clock size={13} /> محجوزة لـ: {reservedFor ?? 'عميل'}
        </div>
        {expiresAt && (
          <p className="text-[10px] text-amber-500">
            تنتهي: {new Date(expiresAt).toLocaleString('ar-EG')}
          </p>
        )}
        <button
          onClick={handleCancel}
          disabled={pending}
          className="flex items-center justify-center gap-1.5 w-full border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2 rounded-xl text-xs transition-colors disabled:opacity-60"
        >
          <XCircle size={13} /> إلغاء الحجز
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full border border-amber-300 text-amber-700 hover:bg-amber-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
      >
        <Clock size={15} /> حجز مؤقت (٤٨ ساعة)
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-slate-900">حجز مؤقت</h2>
                <p className="text-xs text-slate-400 mt-0.5">يُحجز لمدة 48 ساعة — قابل للإلغاء</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {feedback && (
              <div className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${feedback.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {feedback.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {feedback.msg}
              </div>
            )}

            <form onSubmit={handleReserve} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">اسم العميل *</label>
                <input name="client_name" required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">رقم الهاتف</label>
                <input name="client_phone" type="tel" dir="ltr"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={pending}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm">
                  {pending ? 'جاري الحجز...' : 'تأكيد الحجز'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-4 border border-slate-200 rounded-xl font-bold text-sm text-slate-600">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
