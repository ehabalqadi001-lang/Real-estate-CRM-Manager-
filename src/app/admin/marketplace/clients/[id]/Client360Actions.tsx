'use client'

import { useState, useTransition } from 'react'
import { ShieldBan, ShieldCheck, Coins, X, AlertCircle } from 'lucide-react'
import { suspendClientAction, manualWalletAdjustAction } from '../actions'

interface Props {
  clientId: string
  isSuspended: boolean
}

export function Client360Actions({ clientId, isSuspended }: Props) {
  const [pending, startTransition] = useTransition()
  const [walletModal, setWalletModal] = useState(false)
  const [direction, setDirection] = useState<'credit' | 'deduct'>('credit')
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function notify(t: typeof toast) {
    setToast(t)
    setTimeout(() => setToast(null), 3500)
  }

  function handleSuspend() {
    const action = isSuspended ? 'تفعيل الحساب' : 'تعليق الحساب'
    if (!confirm(`هل أنت متأكد من ${action}؟`)) return
    startTransition(async () => {
      const res = await suspendClientAction(clientId, !isSuspended)
      if (res.success) {
        notify({ type: 'success', text: isSuspended ? '✅ تم تفعيل الحساب' : '🔒 تم تعليق الحساب' })
      } else {
        notify({ type: 'error', text: res.message ?? 'حدث خطأ' })
      }
    })
  }

  function handleWalletAdjust() {
    const p = parseInt(points, 10)
    if (!p || p <= 0) { notify({ type: 'error', text: 'أدخل مبلغاً صحيحاً' }); return }
    if (!reason.trim()) { notify({ type: 'error', text: 'السبب مطلوب' }); return }
    startTransition(async () => {
      const res = await manualWalletAdjustAction(clientId, direction, p, reason)
      if (res.success) {
        setWalletModal(false)
        setPoints('')
        setReason('')
        notify({ type: 'success', text: direction === 'credit' ? `✅ تمت إضافة ${p} نقطة` : `✅ تم خصم ${p} نقطة` })
      } else {
        notify({ type: 'error', text: res.message ?? 'حدث خطأ' })
      }
    })
  }

  return (
    <>
      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-bold shadow-2xl ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.text}
        </div>
      )}

      <button
        onClick={() => setWalletModal(true)}
        disabled={pending}
        className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/30 active:scale-95 disabled:opacity-40"
      >
        <Coins className="size-4" />
        تعديل المحفظة
      </button>

      <button
        onClick={handleSuspend}
        disabled={pending}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40 ${
          isSuspended
            ? 'bg-emerald-500/80 hover:bg-emerald-500'
            : 'bg-red-500/80 hover:bg-red-500'
        }`}
      >
        {isSuspended ? <ShieldCheck className="size-4" /> : <ShieldBan className="size-4" />}
        {isSuspended ? 'تفعيل الحساب' : 'تعليق الحساب'}
      </button>

      {/* Wallet Adjust Modal */}
      {walletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 sm:p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="size-5 text-emerald-500" />
                <h3 className="font-black text-slate-800">تعديل المحفظة</h3>
              </div>
              <button onClick={() => setWalletModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="size-4" />
              </button>
            </div>

            <div className="mb-3 flex gap-2">
              <button
                onClick={() => setDirection('credit')}
                className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${direction === 'credit' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                + إضافة نقاط
              </button>
              <button
                onClick={() => setDirection('deduct')}
                className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${direction === 'deduct' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                − خصم نقاط
              </button>
            </div>

            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="عدد النقاط"
              min="1"
              className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="سبب التعديل (مطلوب للمراجعة)"
              rows={3}
              className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              dir="rtl"
            />

            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
              <AlertCircle className="size-3.5 shrink-0" />
              سيتم تسجيل هذا التعديل في سجل الأنشطة
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleWalletAdjust}
                disabled={pending || !points || !reason.trim()}
                className={`flex-1 rounded-xl py-2.5 text-sm font-black text-white transition disabled:opacity-40 ${direction === 'credit' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {pending ? 'جاري...' : direction === 'credit' ? 'إضافة النقاط' : 'خصم النقاط'}
              </button>
              <button onClick={() => setWalletModal(false)} className="rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
