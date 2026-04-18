'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertTriangle, Lock, Mail, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loginAction } from './actions'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<{ message: string; details: string } | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorState(null)

    try {
      const result = await loginAction(new FormData(event.currentTarget))
      if (result && !result.success) {
        setErrorState({ message: result.message, details: result.details })
        setLoading(false)
      }
    } catch (err: unknown) {
      const redirect = err as { digest?: string; message?: string }
      if (redirect.digest?.startsWith('NEXT_REDIRECT') || redirect.message === 'NEXT_REDIRECT') throw err
      setErrorState({ message: 'خطأ في الاتصال بالخادم', details: redirect.message ?? 'خطأ غير معروف' })
      setLoading(false)
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--fi-bg)] px-4 py-12 text-[var(--fi-ink)]"
      dir="rtl"
    >
      {/* Subtle brand gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(39,174,96,0.08),transparent_60%)]" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--fi-soft)] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[var(--fi-emerald)]">
            <TrendingUp className="size-3.5" aria-hidden="true" />
            FAST INVESTMENT
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight">تسجيل الدخول</h1>
          <p className="mt-2 text-sm font-medium text-[var(--fi-muted)]">ادخل إلى حسابك في Enterprise CRM Marketplace.</p>
        </div>

        {/* Error message */}
        {errorState && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-red-700">{errorState.message}</p>
              <p className="mt-0.5 text-xs font-medium text-red-500" dir="ltr">{errorState.details}</p>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="fi-card rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-bold text-[var(--fi-ink)]">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  dir="ltr"
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-bg)] px-3 pl-10 text-left text-sm font-medium text-[var(--fi-ink)] placeholder:text-[var(--fi-muted)] outline-none transition-colors focus:border-[var(--fi-emerald)] focus:ring-2 focus:ring-[var(--fi-emerald)]/20"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mt-4">
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-bold text-[var(--fi-ink)]">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  dir="ltr"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-[var(--fi-line)] bg-[var(--fi-bg)] px-3 pl-10 text-left text-sm font-medium text-[var(--fi-ink)] outline-none transition-colors focus:border-[var(--fi-emerald)] focus:ring-2 focus:ring-[var(--fi-emerald)]/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="mt-6 h-11 w-full rounded-xl fi-primary-button text-sm font-bold transition-opacity disabled:opacity-60"
              aria-busy={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                  جاري الدخول...
                </span>
              ) : 'دخول'}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-5 space-y-2 text-center text-sm">
            <Link
              href="/register?role=client"
              className="block font-bold text-[var(--fi-ink)] hover:text-[var(--fi-emerald)] transition-colors"
            >
              تسجيل عملاء جدد
            </Link>
            <Link
              href="/register?role=partner"
              className="block font-bold text-[#C9964A] hover:opacity-80 transition-opacity"
            >
              FAST PARTNERS — انضم كشريك
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
