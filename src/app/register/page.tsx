'use client'

import { useMemo, useState, type ElementType, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { AlertTriangle, Briefcase, Building, FileText, Mail, MapPin, Phone, Upload, User, UserRound } from 'lucide-react'
import { registerAction } from '@/app/login/actions'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const [mode] = useState<'client' | 'partner'>(() => {
    if (typeof window === 'undefined') return 'client'
    const params = new URLSearchParams(window.location.search)
    return params.get('role') === 'partner' ? 'partner' : 'client'
  })
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual')
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<{ message: string; details: string } | null>(null)

  const copy = useMemo(() => {
    if (mode === 'partner') {
      return {
        eyebrow: 'FAST PARTNERS',
        title: 'بوابة تسجيل الشركاء',
        subtitle: 'تسجيل وكلاء عقاريين وشركات وساطة للمراجعة والاعتماد.',
        button: 'إرسال طلب الشراكة',
      }
    }

    return {
      eyebrow: 'FAST INVESTMENT',
      title: 'تسجيل عملاء جداد',
      subtitle: 'حساب عميل مخصص لإضافة وحداتك ومتابعة المحادثات والدعم.',
      button: 'إنشاء حساب عميل',
    }
  }, [mode])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorState(null)

    const formData = new FormData(event.currentTarget)
    formData.set('registrationMode', mode)
    if (mode === 'client') formData.set('accountType', 'client')

    try {
      const result = await registerAction(formData)
      if (result && !result.success) {
        setErrorState({ message: result.message, details: result.details })
        setLoading(false)
      }
    } catch (err: unknown) {
      const redirect = err as { digest?: string; message?: string }
      if (redirect.digest?.startsWith('NEXT_REDIRECT') || redirect.message === 'NEXT_REDIRECT') throw err
      setErrorState({
        message: 'خطأ في الاتصال بالخادم',
        details: redirect.message ?? 'خطأ غير معروف',
      })
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFA] px-4 py-10 text-[#102033]" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-black tracking-widest text-[#C9964A]">{copy.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black">{copy.title}</h1>
          <p className="mt-3 text-sm font-bold leading-7 text-[#64748B]">{copy.subtitle}</p>
        </div>

        {errorState && (
          <div className="mb-5 rounded-lg border border-[#B54747]/25 bg-[#B54747]/10 p-4 text-center">
            <AlertTriangle className="mx-auto mb-2 size-5 text-[#B54747]" />
            <p className="text-sm font-black text-[#B54747]">{errorState.message}</p>
            <p className="mt-1 text-xs font-semibold text-[#64748B]" dir="ltr">{errorState.details}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-lg border border-[#DDE6E4] bg-white p-6 shadow-sm" encType="multipart/form-data">
          <input type="hidden" name="registrationMode" value={mode} />
          <input type="hidden" name="accountType" value={mode === 'client' ? 'client' : accountType} />

          {mode === 'partner' && (
            <div className="mb-6">
              <p className="mb-3 text-center text-xs font-black text-[#64748B]">نوع حساب الشريك</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('individual')}
                  className={`rounded-lg border p-4 text-center transition ${accountType === 'individual' ? 'border-[#17375E] bg-[#EEF6F5] text-[#17375E]' : 'border-[#DDE6E4] text-[#64748B]'}`}
                >
                  <User className="mx-auto mb-2 size-5" />
                  <span className="text-sm font-black">وكيل عقاري</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('company')}
                  className={`rounded-lg border p-4 text-center transition ${accountType === 'company' ? 'border-[#17375E] bg-[#EEF6F5] text-[#17375E]' : 'border-[#DDE6E4] text-[#64748B]'}`}
                >
                  <Briefcase className="mx-auto mb-2 size-5" />
                  <span className="text-sm font-black">شركة وساطة</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={mode === 'client' ? 'اسم العميل بالكامل' : 'الاسم الكامل / مسؤول التواصل'} icon={mode === 'client' ? UserRound : User}>
              <input name="fullName" required className="field-input" />
            </Field>

            <Field label="رقم الهاتف" icon={Phone}>
              <input name="phone" required className="field-input text-left" dir="ltr" placeholder="01X XXXX XXXX" />
            </Field>

            <Field label="المنطقة / المحافظة" icon={MapPin}>
              <input name="region" required className="field-input" />
            </Field>

            <Field label="البريد الإلكتروني" icon={Mail}>
              <input name="email" type="email" required className="field-input text-left" dir="ltr" placeholder="name@example.com" />
            </Field>

            <Field label="كلمة المرور" icon={FileText}>
              <input name="password" type="password" required minLength={8} className="field-input text-left" dir="ltr" />
            </Field>

            {mode === 'partner' && accountType === 'company' && (
              <>
                <Field label="اسم الشركة الرسمي" icon={Building}>
                  <input name="companyName" required className="field-input" />
                </Field>
                <Field label="رقم السجل التجاري" icon={FileText}>
                  <input name="commercialRegNo" required className="field-input text-left" dir="ltr" />
                </Field>
              </>
            )}
          </div>

          {mode === 'partner' && (
            <div className="mt-6 border-t border-[#DDE6E4] pt-5">
              <p className="mb-3 text-center text-xs font-black text-[#64748B]">وثائق الشريك للمراجعة</p>
              <div className="grid gap-3 md:grid-cols-2">
                <UploadBox name="idDocument" label="بطاقة الهوية" required />
                {accountType === 'company' && <UploadBox name="licenseDocument" label="السجل التجاري أو رخصة المزاولة" required />}
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-6 h-11 w-full bg-[#17375E] text-white hover:bg-[#102033]">
            {loading ? 'جاري المعالجة...' : copy.button}
          </Button>

          <p className="mt-5 text-center text-sm font-semibold text-[#64748B]">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="font-black text-[#17375E]">تسجيل الدخول</Link>
          </p>
        </form>
      </div>

      <style jsx>{`
        .field-input {
          height: 44px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid #dde6e4;
          background: #fbfcfa;
          padding: 0 40px 0 12px;
          font-size: 14px;
          font-weight: 700;
          outline: none;
        }
        .field-input:focus {
          border-color: #0f8f83;
          box-shadow: 0 0 0 3px rgb(15 143 131 / 16%);
        }
      `}</style>
    </main>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: ElementType; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-[#102033]">{label}</span>
      <span className="relative block">
        <Icon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
        {children}
      </span>
    </label>
  )
}

function UploadBox({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <label className="relative block rounded-lg border-2 border-dashed border-[#DDE6E4] bg-[#FBFCFA] p-4 text-center transition hover:border-[#17375E]">
      <Upload className="mx-auto mb-2 size-5 text-[#17375E]" />
      <span className="block text-sm font-black text-[#102033]">{label}</span>
      <span className="mt-1 block text-xs font-semibold text-[#64748B]">PDF أو صورة</span>
      <input name={name} type="file" required={required} accept="image/*,.pdf" className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  )
}
