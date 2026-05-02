'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createBrowserSupabaseClient } from '@/shared/supabase/browser'

type FormState = {
  ok: boolean
  message: string
}

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [state, setState] = useState<FormState | null>(null)
  const [pending, setPending] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })

    supabase.auth.getUser().then(({ data }) => {
      setReady(Boolean(data.user))
    })

    return () => listener.subscription.unsubscribe()
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setState(null)

    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    if (password.length < 8) {
      setState({ ok: false, message: 'كلمة المرور يجب ألا تقل عن 8 أحرف.' })
      setPending(false)
      return
    }

    if (password !== confirmPassword) {
      setState({ ok: false, message: 'كلمتا المرور غير متطابقتين.' })
      setPending(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setState({ ok: false, message: error.message })
      setPending(false)
      return
    }

    await supabase.auth.signOut()
    setState({ ok: true, message: 'تم تعيين كلمة المرور الجديدة بنجاح. يمكنك تسجيل الدخول الآن.' })
    setPending(false)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--fi-bg)] px-4 py-12 text-[var(--fi-ink)]" dir="rtl">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--fi-soft)] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[var(--fi-emerald)]">
            <ShieldCheck className="size-3.5" />
            FAST INVESTMENT
          </span>
          <h1 className="mt-4 text-xl sm:text-3xl font-black">تعيين كلمة مرور جديدة</h1>
          <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
            اختر كلمة مرور قوية لحسابك. هذا الإجراء متاح لكل العملاء والوكلاء ومديري الشركات.
          </p>
        </div>

        {state && (
          <div
            role="alert"
            className={`mb-5 rounded-lg border p-4 text-center ${
              state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {state.ok ? <CheckCircle2 className="mx-auto mb-2 size-5" /> : <AlertTriangle className="mx-auto mb-2 size-5" />}
            <p className="text-sm font-black">{state.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="fi-card rounded-lg p-4 sm:p-6">
          {!ready && !state?.ok && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs font-bold leading-6 text-amber-700">
              افتح هذه الصفحة من رابط الاستعادة الموجود في البريد. إذا انتهت صلاحية الرابط، اطلب رابطاً جديداً.
            </div>
          )}

          <div className="space-y-4">
            <PasswordField name="password" label="كلمة المرور الجديدة" autoComplete="new-password" />
            <PasswordField name="confirmPassword" label="تأكيد كلمة المرور" autoComplete="new-password" />
          </div>

          <Button type="submit" disabled={pending || state?.ok} className="fi-primary-button mt-6 h-11 w-full rounded-lg text-sm font-bold">
            {pending ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
          </Button>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold">
            <Link href="/login" className="text-[var(--fi-emerald)] hover:underline">تسجيل الدخول</Link>
            <span className="text-[var(--fi-muted)]">•</span>
            <Link href="/forgot-password" className="text-[var(--fi-muted)] hover:text-[var(--fi-emerald)]">طلب رابط جديد</Link>
          </div>
        </form>
      </div>
    </main>
  )
}

function PasswordField({ name, label, autoComplete }: { name: string; label: string; autoComplete: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-[var(--fi-ink)]">{label}</span>
      <span className="relative block">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fi-muted)]" />
        <input
          name={name}
          type="password"
          required
          minLength={8}
          dir="ltr"
          autoComplete={autoComplete}
          className="h-11 w-full rounded-lg border border-[var(--fi-line)] bg-[var(--fi-bg)] px-3 pl-10 text-left text-sm font-bold text-[var(--fi-ink)] outline-none focus:border-[var(--fi-emerald)] focus:ring-2 focus:ring-[var(--fi-emerald)]/20"
        />
      </span>
    </label>
  )
}
