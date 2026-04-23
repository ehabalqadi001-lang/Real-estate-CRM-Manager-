'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, Lock, Mail, TrendingUp } from 'lucide-react'
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
      className="min-h-screen bg-[radial-gradient(circle_at_top_right,#E9F4EF_0%,#F7FAF8_50%,#FFFFFF_100%)] px-4 py-10 text-[#102033]"
      dir="rtl"
    >
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-[#DDE6E4] bg-white/85 p-6 shadow-lg backdrop-blur sm:p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9964A]/30 bg-[#FFF6E8] px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#A0712A]">
            <TrendingUp className="size-3.5" />
            FAST INVESTMENT
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight text-[#102033]">
            تسجيل الدخول
            <span className="block text-[#0F8F83]">إلى منصة السوق والـ CRM</span>
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-8 text-[#5B7284]">
            تحكم كامل في الصفقات، الإعلانات، والمتابعة مع تجربة موحدة لفريقك وعملائك.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Stat value="24/7" label="تشغيل مستمر" />
            <Stat value="BRM" label="متابعة شركاء" />
            <Stat value="Live" label="بيانات فورية" />
          </div>
        </section>

        <section className="rounded-3xl border border-[#DDE6E4] bg-white p-6 shadow-lg sm:p-8">
          {errorState && (
            <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-700">{errorState.message}</p>
                <p className="mt-0.5 text-xs font-medium text-red-500" dir="ltr">{errorState.details}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-black text-[#102033]">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  dir="ltr"
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-[#DDE6E4] bg-[#FBFCFA] px-3 pl-10 text-left text-sm font-semibold text-[#102033] outline-none transition focus:border-[#0F8F83] focus:ring-3 focus:ring-[#0F8F83]/20"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-black text-[#102033]">
                  كلمة المرور
                </label>
                <Link href="/forgot-password" className="text-xs font-black text-[#0F8F83] hover:underline">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  dir="ltr"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-[#DDE6E4] bg-[#FBFCFA] px-3 pl-10 text-left text-sm font-semibold text-[#102033] outline-none transition focus:border-[#0F8F83] focus:ring-3 focus:ring-[#0F8F83]/20"
                  placeholder="********"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-[#17375E] text-sm font-black text-white hover:bg-[#102033] disabled:opacity-60"
              aria-busy={loading}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm font-bold">
            <Link href="/register?role=client" className="block text-[#102033] transition hover:text-[#0F8F83]">
              تسجيل عملاء جدد
            </Link>
            <Link href="/register?role=partner" className="block text-[#A0712A] transition hover:text-[#8A601F]">
              FAST PARTNERS - انضم كشريك
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[#DDE6E4] bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-lg font-black text-[#17375E]">{value}</p>
        <ArrowUpRight className="size-4 text-[#0F8F83]" />
      </div>
      <p className="mt-1 text-xs font-bold text-[#64748B]">{label}</p>
    </div>
  )
}
