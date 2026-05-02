'use client'
import { useI18n } from '@/hooks/use-i18n'

import { useState, useTransition } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, X, Loader2, CheckCircle2, AlertCircle, QrCode } from 'lucide-react'

export default function TwoFactorSetup() {
  const { dir } = useI18n()
  const [open, setOpen]         = useState(false)
  const [step, setStep]         = useState<'idle' | 'enroll' | 'verify' | 'done'>('idle')
  const [qrCode, setQrCode]     = useState('')
  const [secret, setSecret]     = useState('')
  const [factorId, setFactorId] = useState('')
  const [otp, setOtp]           = useState('')
  const [error, setError]       = useState('')
  const [pending, start]        = useTransition()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const startEnroll = () => {
    setError('')
    start(async () => {
      const { data, error: err } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'FAST INVESTMENT CRM',
      })
      if (err || !data) { setError(err?.message ?? 'فشل تهيئة المصادقة الثنائية'); return }
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setFactorId(data.id)
      setStep('enroll')
    })
  }

  const verifyOtp = () => {
    if (otp.length < 6) { setError('أدخل رمز التحقق المكون من 6 أرقام'); return }
    setError('')
    start(async () => {
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
      if (!challenge) { setError('فشل إنشاء التحدي'); return }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: otp,
      })
      if (verifyErr) { setError(verifyErr.message); return }
      setStep('done')
    })
  }

  const close = () => { setOpen(false); setStep('idle'); setOtp(''); setError(''); setQrCode(''); setSecret('') }

  return (
    <>
      <button
        type="button"
        onClick={() => { close(); setOpen(true) }}
        className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/10 py-2.5 text-sm font-bold transition hover:bg-white/20"
      >
        <ShieldCheck size={14} className="mr-2 inline" aria-hidden="true" />
        إعداد المصادقة الثنائية (2FA)
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 sm:p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-black text-[var(--fi-ink)]">
                <ShieldCheck className="size-5 text-[var(--fi-emerald)]" />
                المصادقة الثنائية (TOTP)
              </h2>
              <button type="button" onClick={close} className="flex size-8 items-center justify-center rounded-lg hover:bg-[var(--fi-soft)] text-[var(--fi-muted)]">
                <X size={16} />
              </button>
            </div>

            {step === 'idle' && (
              <>
                <p className="mb-5 text-sm font-semibold text-[var(--fi-muted)]">
                  تفعيل المصادقة الثنائية يضيف طبقة حماية إضافية لحسابك. ستحتاج إلى تطبيق مثل Google Authenticator أو Authy.
                </p>
                <Button
                  disabled={pending}
                  onClick={startEnroll}
                  className="w-full bg-[var(--fi-emerald)] font-semibold text-white"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
                  {pending ? 'جاري التهيئة…' : 'ابدأ الإعداد'}
                </Button>
              </>
            )}

            {step === 'enroll' && (
              <>
                <p className="mb-3 text-sm font-semibold text-[var(--fi-muted)]">
                  امسح رمز QR بتطبيق المصادقة الخاص بك، ثم أدخل الرمز المكون من 6 أرقام للتحقق.
                </p>
                {qrCode && (
                  <div className="mb-4 flex justify-center rounded-xl bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="QR Code" className="h-48 w-48" />
                  </div>
                )}
                {secret && (
                  <div className="mb-4 rounded-lg bg-[var(--fi-soft)] px-3 py-2 text-center">
                    <p className="text-xs font-semibold text-[var(--fi-muted)]">أو أدخل المفتاح يدويًا</p>
                    <p className="mt-1 break-all font-mono text-xs font-bold text-[var(--fi-ink)]">{secret}</p>
                  </div>
                )}
                <Input
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  className="mb-2 text-center text-2xl tracking-[0.5em]"
                  onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
                />
                {error && <p className="mb-3 flex items-center gap-1 text-xs font-semibold text-red-600"><AlertCircle className="size-3.5" />{error}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
                  <Button disabled={pending || otp.length < 6} onClick={verifyOtp} className="flex-1 bg-[var(--fi-emerald)] text-white">
                    {pending ? <Loader2 className="size-4 animate-spin" /> : 'تحقق وفعّل'}
                  </Button>
                </div>
              </>
            )}

            {step === 'done' && (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 size-16 text-[var(--fi-emerald)]" />
                <p className="font-black text-[var(--fi-ink)]">تم تفعيل المصادقة الثنائية بنجاح!</p>
                <p className="mt-2 text-sm font-semibold text-[var(--fi-muted)]">سيُطلب منك رمز TOTP عند كل تسجيل دخول.</p>
                <Button onClick={close} className="mt-4 bg-[var(--fi-emerald)] text-white">حسنًا</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
