'use client'

import { useState, type ElementType, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, Building2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
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
      setErrorState({
        message: 'تعذر الاتصال بالخادم',
        details: redirect.message ?? 'خطأ غير معروف',
      })
      setLoading(false)
    }
  }

  return (
    <main
      className="nextora-market min-h-screen px-4 py-6 text-market-ink sm:py-8"
      dir="rtl"
    >
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="nextora-card relative overflow-hidden rounded-3xl p-6 text-white sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#FFFFFF,transparent)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-[#E8C488]">
                <Sparkles className="size-4" />
                FAST INVESTMENT
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                دخول موحد لإدارة السوق العقاري والـ CRM
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/72">
                تابع العملاء، الإعلانات، الصفقات، الشركاء، ونقاط البيع من حساب واحد مرتبط بصلاحيات واضحة لكل مستخدم.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Stat value="CRM" label="إدارة العملاء" />
                <Stat value="BRM" label="علاقات الشركاء" />
                <Stat value="Live" label="متابعة فورية" />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Feature icon={ShieldCheck} title="صلاحيات مؤسسية" text="توجيه المستخدم تلقائيا حسب دوره داخل النظام." />
              <Feature icon={Building2} title="FAST Marketplace" text="بوابة واحدة للإعلانات، النقاط، والدعم." />
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="nextora-glass w-full rounded-3xl p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)] sm:p-7">
            <div className="mb-6">
              <p className="text-xs font-black text-market-gold">SECURE ACCESS</p>
              <h2 className="mt-2 text-3xl font-black text-market-ink">تسجيل الدخول</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-market-slate">
                استخدم بريدك وكلمة المرور للدخول إلى مساحة عملك.
              </p>
            </div>

            {errorState && (
              <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-red-700">{errorState.message}</p>
                  <p className="mt-1 break-words text-xs font-semibold text-red-500" dir="ltr">{errorState.details}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-black text-market-ink">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-market-slate" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    dir="ltr"
                    autoComplete="email"
                    className="h-12 w-full rounded-2xl border border-market-line bg-market-paper px-3 pl-10 text-left text-sm font-bold text-market-ink outline-none transition focus:border-market-teal focus:ring-4 focus:ring-market-teal/15"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="text-sm font-black text-market-ink">
                    كلمة المرور
                  </label>
                  <Link href="/forgot-password" className="text-xs font-black text-market-teal hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-market-slate" />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    dir="ltr"
                    autoComplete="current-password"
                    className="h-12 w-full rounded-2xl border border-market-line bg-market-paper px-3 pl-10 text-left text-sm font-bold text-market-ink outline-none transition focus:border-market-teal focus:ring-4 focus:ring-market-teal/15"
                    placeholder="********"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="nextora-button h-12 w-full rounded-2xl text-sm font-black shadow-sm disabled:opacity-60"
                aria-busy={loading}
              >
                {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
              </Button>
            </form>

            <div className="mt-6 grid gap-3 text-center text-sm font-bold sm:grid-cols-2">
              <Link href="/register?role=client" className="rounded-2xl border border-market-line bg-market-paper px-4 py-3 text-market-ink transition hover:border-market-teal hover:text-market-teal">
                تسجيل عميل جديد
              </Link>
              <Link href="/register?role=partner" className="rounded-2xl border border-market-line bg-white/5 px-4 py-3 text-white transition hover:border-market-teal">
                انضم كشريك
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-xl font-black text-white">{value}</p>
        <ArrowUpRight className="size-4 text-[#57D5B8]" />
      </div>
      <p className="mt-1 text-xs font-bold text-white/65">{label}</p>
    </div>
  )
}

function Feature({ icon: Icon, title, text }: { icon: ElementType; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
      <Icon className="mb-3 size-5 text-[#E8C488]" />
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/60">{text}</p>
    </div>
  )
}
