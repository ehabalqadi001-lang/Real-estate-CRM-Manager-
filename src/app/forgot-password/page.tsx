'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Mail, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requestPasswordReset, type ForgotPasswordState } from './actions'

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<ForgotPasswordState | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setState(null)
    const result = await requestPasswordReset(new FormData(event.currentTarget))
    setState(result)
    setPending(false)
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#EEF6F5_0%,#F7FAF8_45%,#FFFFFF_100%)] px-4 py-12 text-[var(--fi-ink)]"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(39,174,96,0.08),transparent_45%)]" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--fi-soft)] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[var(--fi-emerald)]">
            <RotateCcw className="size-3.5" />
            FAST INVESTMENT
          </span>
          <h1 className="mt-4 text-xl sm:text-3xl font-black">استعادة كلمة المرور</h1>
          <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
            أدخل بريدك الإلكتروني وسنرسل لك رابطا آمنا لتعيين كلمة مرور جديدة.
          </p>
        </div>

        {state && (
          <div
            role="alert"
            className={`mb-5 rounded-xl border p-4 text-center ${
              state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {state.ok ? <CheckCircle2 className="mx-auto mb-2 size-5" /> : <AlertTriangle className="mx-auto mb-2 size-5" />}
            <p className="text-sm font-black">{state.message}</p>
            {state.details && <p className="mt-1 text-xs font-semibold" dir="ltr">{state.details}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="fi-card rounded-2xl p-4 sm:p-6 sm:p-8">
          <label htmlFor="reset-email" className="mb-1.5 block text-sm font-black text-[var(--fi-ink)]">
            البريد الإلكتروني
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" />
            <input
              id="reset-email"
              name="email"
              type="email"
              required
              dir="ltr"
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-bg)] px-3 pl-10 text-left text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)] focus:ring-2 focus:ring-[var(--fi-emerald)]/20"
              placeholder="you@example.com"
            />
          </div>

          <Button type="submit" disabled={pending} className="fi-primary-button mt-6 h-11 w-full rounded-xl text-sm font-bold">
            {pending ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
          </Button>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold">
            <Link href="/login" className="text-[var(--fi-emerald)] hover:underline">العودة لتسجيل الدخول</Link>
            <span className="text-[var(--fi-muted)]">*</span>
            <Link href="/register?role=client" className="text-[var(--fi-muted)] hover:text-[var(--fi-emerald)]">إنشاء حساب جديد</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
