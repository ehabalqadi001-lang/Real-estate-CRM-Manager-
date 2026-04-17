'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertTriangle, Lock, Mail } from 'lucide-react'
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
    <main className="flex min-h-screen items-center justify-center bg-[#FBFCFA] px-4 py-12 text-[#102033]" dir="rtl">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-black tracking-widest text-[#C9964A]">FAST INVESTMENT</p>
          <h1 className="mt-2 text-3xl font-black">تسجيل الدخول</h1>
          <p className="mt-3 text-sm font-bold text-[#64748B]">ادخل إلى حسابك في Enterprise CRM Marketplace.</p>
        </div>

        {errorState && (
          <div className="mb-5 rounded-lg border border-[#B54747]/25 bg-[#B54747]/10 p-4 text-center">
            <AlertTriangle className="mx-auto mb-2 size-5 text-[#B54747]" />
            <p className="text-sm font-black text-[#B54747]">{errorState.message}</p>
            <p className="mt-1 text-xs font-semibold text-[#64748B]" dir="ltr">{errorState.details}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-lg border border-[#DDE6E4] bg-white p-6 shadow-sm">
          <label className="block">
            <span className="mb-1.5 block text-sm font-black">البريد الإلكتروني</span>
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
              <input
                name="email"
                type="email"
                required
                dir="ltr"
                className="h-11 w-full rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] px-3 pl-10 text-left text-sm font-bold outline-none focus:border-[#0F8F83] focus:ring-3 focus:ring-[#0F8F83]/20"
              />
            </span>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-black">كلمة المرور</span>
            <span className="relative block">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
              <input
                name="password"
                type="password"
                required
                dir="ltr"
                className="h-11 w-full rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] px-3 pl-10 text-left text-sm font-bold outline-none focus:border-[#0F8F83] focus:ring-3 focus:ring-[#0F8F83]/20"
              />
            </span>
          </label>

          <Button type="submit" disabled={loading} className="mt-6 h-11 w-full bg-[#17375E] text-white hover:bg-[#102033]">
            {loading ? 'جاري الدخول...' : 'دخول'}
          </Button>

          <div className="mt-5 grid gap-2 text-center text-sm font-bold text-[#64748B]">
            <Link href="/register?role=client" className="text-[#17375E]">تسجيل عملاء جداد</Link>
            <Link href="/register?role=partner" className="text-[#C9964A]">FAST PARTNERS</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
