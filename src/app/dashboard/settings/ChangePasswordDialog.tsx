'use client'

import { useState, useTransition } from 'react'
import { KeyRound, X, Loader2, Eye, EyeOff } from 'lucide-react'
import { changePassword } from './actions'

export default function ChangePasswordDialog() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setCurrent(''); setNext(''); setConfirm('')
    setError(null); setSuccess(false)
    setShowCurrent(false); setShowNext(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) { setError('كلمتا المرور الجديدتان غير متطابقتين'); return }
    if (next.length < 8) { setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'); return }
    setError(null)
    startTransition(async () => {
      const res = await changePassword(current, next)
      if (!res.ok) { setError(res.error ?? 'حدث خطأ'); return }
      setSuccess(true)
      setTimeout(() => { setOpen(false); reset() }, 2000)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { reset(); setOpen(true) }}
        className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/10 py-2.5 text-sm font-bold transition hover:bg-white/20"
      >
        <KeyRound size={14} className="mr-2 inline" aria-hidden="true" />
        تغيير كلمة المرور
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 sm:p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-black text-[var(--fi-ink)]">تغيير كلمة المرور</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="flex size-8 items-center justify-center rounded-lg hover:bg-[var(--fi-soft)] text-[var(--fi-muted)]">
                <X size={16} />
              </button>
            </div>

            {success ? (
              <div className="rounded-xl bg-[var(--fi-soft)] p-4 text-center text-sm font-bold text-[var(--fi-emerald)]">
                تم تغيير كلمة المرور بنجاح
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--fi-muted)]">كلمة المرور الحالية</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={current}
                      onChange={e => setCurrent(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2.5 text-sm font-bold text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fi-muted)]">
                      {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--fi-muted)]">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      type={showNext ? 'text' : 'password'}
                      value={next}
                      onChange={e => setNext(e.target.value)}
                      required
                      minLength={8}
                      className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2.5 text-sm font-bold text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
                    />
                    <button type="button" onClick={() => setShowNext(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fi-muted)]">
                      {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--fi-muted)]">تأكيد كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-4 py-2.5 text-sm font-bold text-[var(--fi-ink)] outline-none focus:ring-2 focus:ring-[var(--fi-emerald)]/30"
                  />
                </div>

                {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={isPending || !current || !next || !confirm}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--fi-emerald)] py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  {isPending ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
