'use client'

import { useMemo, useState, type ElementType, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileArchive,
  FileText,
  IdCard,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  User,
  UsersRound,
} from 'lucide-react'
import { registerAction } from '@/app/login/actions'
import { Button } from '@/components/ui/button'

type PartnerAccountType = 'broker_freelancer' | 'company'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('role') === 'partner' ? 'partner' : 'client'
  const [accountType, setAccountType] = useState<PartnerAccountType>('broker_freelancer')
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<{ message: string; details: string } | null>(null)
  const isAlreadyRegistered = `${errorState?.message ?? ''} ${errorState?.details ?? ''}`.toLowerCase().includes('registered')

  const copy = useMemo(() => {
    if (mode === 'partner') {
      return {
        eyebrow: 'FAST INVESTMENT PARTNERS',
        title: 'تسجيل حساب شريك',
        subtitle: 'بوابة اعتماد الوسطاء والشركات وربطهم بنظام Broker Relationship Management.',
        button: 'إرسال طلب الشراكة',
      }
    }

    return {
      eyebrow: 'FAST INVESTMENT',
      title: 'تسجيل عميل جديد',
      subtitle: 'حساب عميل مخصص لإدارة الطلبات والمحادثات والدعم داخل النظام.',
      button: 'إنشاء حساب عميل',
    }
  }, [mode])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorState(null)

    const formData = new FormData(event.currentTarget)
    formData.set('registrationMode', mode)
    formData.set('accountType', mode === 'client' ? 'client' : accountType)

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
        message: 'تعذر الاتصال بالخادم',
        details: redirect.message ?? 'خطأ غير معروف',
      })
      setLoading(false)
    }
  }

  return (
    <main className="nextora-market min-h-screen px-4 py-6 text-market-ink sm:py-8" dir="rtl">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="nextora-card overflow-hidden rounded-3xl p-6 text-white lg:sticky lg:top-6 lg:h-fit">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-[#E8C488]">
            <BadgeCheck className="size-4" />
            {copy.eyebrow}
          </div>
          <h1 className="text-4xl font-black leading-tight">{copy.title}</h1>
          <p className="mt-4 text-sm font-bold leading-7 text-white/72">{copy.subtitle}</p>

          <div className="mt-7 grid gap-3">
            <InfoCard icon={ShieldCheck} title="مراجعة واعتماد" text="مراجعة المستندات وتفعيل الحساب بعد التأكد من صحة البيانات." />
            <InfoCard icon={BriefcaseBusiness} title="BRM Flow" text="ربط تلقائي بإدارة علاقات الشركاء ومراحل المبيعات والعمولات." />
            <InfoCard icon={CheckCircle2} title="FAST INVESTMENT" text="كل حساب يرتبط بسياق الشركة والصلاحيات المناسبة له." />
          </div>
        </aside>

        <div className="space-y-4">
          {errorState && (
            <div className="rounded-2xl border border-[#B54747]/25 bg-[#B54747]/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#B54747]" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#B54747]">{errorState.message}</p>
                  <p className="mt-1 break-words text-xs font-semibold text-market-slate" dir="ltr">{errorState.details}</p>
                  {isAlreadyRegistered && (
                    <Link
                      href="/forgot-password"
                      className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-market-navy px-4 text-sm font-black text-white transition hover:bg-market-ink"
                    >
                      استعادة كلمة المرور
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="nextora-glass rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.34)] sm:p-7" encType="multipart/form-data">
            <input type="hidden" name="registrationMode" value={mode} />
            <input type="hidden" name="accountType" value={mode === 'client' ? 'client' : accountType} />

            {mode === 'partner' && (
              <div className="mb-7 rounded-3xl border border-market-line bg-market-paper p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-market-gold">ACCOUNT TYPE</p>
                    <h2 className="mt-1 text-xl font-black text-market-ink">نوع حساب الشريك</h2>
                  </div>
                  <span className="rounded-full bg-market-mist px-3 py-1.5 text-xs font-black text-market-teal">اختيار إلزامي</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <ChoiceButton
                    active={accountType === 'broker_freelancer'}
                    icon={UsersRound}
                    title="Broker / Freelancer"
                    description="وسيط فردي يرفع مبيعاته ومستنداته وعمولاته."
                    onClick={() => setAccountType('broker_freelancer')}
                  />
                  <ChoiceButton
                    active={accountType === 'company'}
                    icon={BriefcaseBusiness}
                    title="حساب شركات"
                    description="شركة وساطة لها مدير وملفات اعتماد ومتابعة مع Account Manager."
                    onClick={() => setAccountType('company')}
                  />
                </div>
              </div>
            )}

            {mode === 'client' ? (
              <ClientFields />
            ) : accountType === 'broker_freelancer' ? (
              <BrokerFields />
            ) : (
              <CompanyFields />
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <Button type="submit" disabled={loading} className="nextora-button h-12 w-full rounded-2xl shadow-sm disabled:opacity-60">
                {loading ? 'جاري المعالجة...' : copy.button}
              </Button>
              <div className="inline-flex items-center justify-center rounded-2xl border border-market-line bg-market-paper px-4 py-3 text-xs font-bold text-market-slate">
                <CheckCircle2 className="ml-2 size-4 text-market-teal" />
                حماية وتدقيق للملفات
              </div>
            </div>

            <div className="mt-6 grid gap-2 text-center text-sm font-semibold text-market-slate sm:grid-cols-2">
              <p>
                لديك حساب بالفعل؟ <Link href="/login" className="font-black text-market-navy hover:underline">تسجيل الدخول</Link>
              </p>
              <p>
                نسيت كلمة المرور؟ <Link href="/forgot-password" className="font-black text-market-navy hover:underline">استعادة الحساب</Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .field-input {
          height: 48px;
          width: 100%;
          border-radius: 16px;
          border: 1px solid #2d2d2d;
          background: #111111;
          padding: 0 42px 0 12px;
          font-size: 14px;
          font-weight: 700;
          outline: none;
          transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
        }
        .field-input:focus {
          border-color: #8ab4ff;
          background: #111111;
          box-shadow: 0 0 0 4px rgb(138 180 255 / 18%);
        }
      `}</style>
    </main>
  )
}

function InfoCard({ icon: Icon, title, text }: { icon: ElementType; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
      <Icon className="mb-3 size-5 text-[#E8C488]" />
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/62">{text}</p>
    </div>
  )
}

function ClientFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="اسم العميل بالكامل" icon={User}>
        <input name="fullName" required className="field-input" />
      </Field>
      <Field label="رقم الهاتف" icon={Phone}>
        <input name="phone" required className="field-input text-left" dir="ltr" placeholder="01X XXXX XXXX" />
      </Field>
      <Field label="المنطقة / المحافظة" icon={Building2}>
        <input name="region" required className="field-input" />
      </Field>
      <Field label="البريد الإلكتروني" icon={Mail}>
        <input name="email" type="email" required className="field-input text-left" dir="ltr" placeholder="name@example.com" />
      </Field>
      <Field label="كلمة المرور" icon={LockKeyhole}>
        <input name="password" type="password" required minLength={8} className="field-input text-left" dir="ltr" />
      </Field>
    </div>
  )
}

function BrokerFields() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="الاسم الأول" icon={User}>
          <input name="firstName" required className="field-input" />
        </Field>
        <Field label="الاسم الثاني" icon={User}>
          <input name="lastName" required className="field-input" />
        </Field>
        <Field label="البريد الإلكتروني" icon={Mail}>
          <input name="email" type="email" required className="field-input text-left" dir="ltr" placeholder="name@example.com" />
        </Field>
        <Field label="الرقم" icon={Phone}>
          <input name="phone" required className="field-input text-left" dir="ltr" placeholder="01X XXXX XXXX" />
        </Field>
        <Field label="إنشاء باسورد" icon={LockKeyhole}>
          <input name="password" type="password" required minLength={8} className="field-input text-left" dir="ltr" />
        </Field>
        <Field label="تأكيد الباسورد" icon={LockKeyhole}>
          <input name="confirmPassword" type="password" required minLength={8} className="field-input text-left" dir="ltr" />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <UploadBox name="idFront" label="صورة البطاقة - وجه" required />
        <UploadBox name="idBack" label="صورة البطاقة - ظهر" required />
      </div>
    </div>
  )
}

function CompanyFields() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="اسم الشركة" icon={Building2}>
          <input name="companyName" required className="field-input" />
        </Field>
        <Field label="اسم مدير الشركة" icon={User}>
          <input name="managerName" required className="field-input" />
        </Field>
        <Field label="رقم تواصل مدير الشركة" icon={Phone}>
          <input name="managerPhone" required className="field-input text-left" dir="ltr" />
        </Field>
        <Field label="رقم تواصل صاحب الشركة" icon={Phone}>
          <input name="ownerPhone" required className="field-input text-left" dir="ltr" />
        </Field>
        <Field label="البريد الإلكتروني" icon={Mail}>
          <input name="email" type="email" required className="field-input text-left" dir="ltr" placeholder="company@example.com" />
        </Field>
        <Field label="لينك الفيس بوك" icon={FileText}>
          <input name="facebookUrl" type="url" className="field-input text-left" dir="ltr" placeholder="https://facebook.com/..." />
        </Field>
        <Field label="إنشاء باسورد" icon={LockKeyhole}>
          <input name="password" type="password" required minLength={8} className="field-input text-left" dir="ltr" />
        </Field>
        <Field label="تأكيد الباسورد" icon={LockKeyhole}>
          <input name="confirmPassword" type="password" required minLength={8} className="field-input text-left" dir="ltr" />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <UploadBox name="commercialRegisterFiles" label="السجل التجاري - حتى 3 ملفات" required multiple />
        <UploadBox name="taxCardImage" label="صورة البطاقة الضريبية" required />
        <UploadBox name="ownerIdImage" label="صورة بطاقة صاحب الشركة" required />
        <UploadBox name="vatCertificate" label="شهادة القيمة المضافة إن وجدت" />
      </div>
    </div>
  )
}

function ChoiceButton({ active, icon: Icon, title, description, onClick }: {
  active: boolean
  icon: ElementType
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-right transition ${active ? 'border-market-teal bg-market-mist text-market-navy shadow-sm' : 'border-market-line bg-white text-market-slate hover:border-market-teal'}`}
    >
      <Icon className="mb-3 size-5" />
      <span className="block text-sm font-black">{title}</span>
      <span className="mt-1 block text-xs font-semibold leading-5">{description}</span>
    </button>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: ElementType; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-market-ink">{label}</span>
      <span className="relative block">
        <Icon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-market-slate" />
        {children}
      </span>
    </label>
  )
}

function UploadBox({ name, label, required, multiple }: { name: string; label: string; required?: boolean; multiple?: boolean }) {
  return (
    <label className="relative block min-h-36 rounded-2xl border-2 border-dashed border-market-line bg-market-paper p-4 text-center transition hover:border-market-teal hover:bg-market-mist">
      {name.includes('Id') || name.includes('id') ? (
        <IdCard className="mx-auto mb-3 size-6 text-market-navy" />
      ) : name.includes('commercial') ? (
        <FileArchive className="mx-auto mb-3 size-6 text-market-navy" />
      ) : (
        <Upload className="mx-auto mb-3 size-6 text-market-navy" />
      )}
      <span className="block text-sm font-black text-market-ink">{label}</span>
      <span className="mt-1 block text-xs font-semibold text-market-slate">PDF أو صورة</span>
      <input name={name} type="file" required={required} multiple={multiple} accept="image/*,.pdf" className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  )
}
