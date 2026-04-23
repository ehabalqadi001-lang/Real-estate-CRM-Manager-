'use client'

import { useMemo, useState, type ElementType, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileArchive,
  FileText,
  IdCard,
  LockKeyhole,
  Mail,
  Phone,
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
        message: 'خطأ في الاتصال بالخادم',
        details: redirect.message ?? 'خطأ غير معروف',
      })
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#E9F4EF_0%,#F7FAF8_52%,#FFFFFF_100%)] px-4 py-8 text-[#102033]" dir="rtl">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-[#DDE6E4] bg-[#102033] p-6 text-white shadow-lg lg:sticky lg:top-6 lg:h-fit">
          <p className="text-xs font-black tracking-[0.24em] text-[#C9964A]">{copy.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black leading-tight">{copy.title}</h1>
          <p className="mt-4 text-sm font-bold leading-7 text-white/75">{copy.subtitle}</p>

          <div className="mt-6 grid gap-3">
            <InfoCard title="BRM FLOW" text="تسجيل، مراجعة مستندات، اعتماد، ثم تفعيل بوابة المبيعات." />
            <InfoCard title="FAST INVESTMENT" text="كل طلب يرتبط تلقائيا بإدارة علاقات الشركاء." />
          </div>
        </aside>

        <div className="space-y-4">
          {errorState && (
            <div className="rounded-xl border border-[#B54747]/25 bg-[#B54747]/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 text-[#B54747]" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#B54747]">{errorState.message}</p>
                  <p className="mt-1 text-xs font-semibold text-[#64748B]" dir="ltr">{errorState.details}</p>
                  {isAlreadyRegistered && (
                    <Link
                      href="/forgot-password"
                      className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-[#17375E] px-4 text-sm font-black text-white transition hover:bg-[#102033]"
                    >
                      استعادة كلمة المرور
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded-3xl border border-[#DDE6E4] bg-white p-5 shadow-sm sm:p-7" encType="multipart/form-data">
            <input type="hidden" name="registrationMode" value={mode} />
            <input type="hidden" name="accountType" value={mode === 'client' ? 'client' : accountType} />

            {mode === 'partner' && (
              <div className="mb-7 rounded-2xl border border-[#DDE6E4] bg-[#FBFCFA] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-[#64748B]">نوع حساب الشريك</p>
                  <span className="rounded-full bg-[#EEF6F5] px-2.5 py-1 text-[11px] font-black text-[#0F8F83]">اختيار إلزامي</span>
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
              <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-[#17375E] text-white shadow-sm hover:bg-[#102033]">
                {loading ? 'جاري المعالجة...' : copy.button}
              </Button>
              <div className="inline-flex items-center justify-center rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] px-3 py-2 text-xs font-bold text-[#64748B]">
                <CheckCircle2 className="ml-1 size-4 text-[#0F8F83]" />
                حماية وتدقيق للملفات
              </div>
            </div>

            <p className="mt-5 text-center text-sm font-semibold text-[#64748B]">
              لديك حساب بالفعل؟ <Link href="/login" className="font-black text-[#17375E]">تسجيل الدخول</Link>
            </p>
            <p className="mt-2 text-center text-sm font-semibold text-[#64748B]">
              نسيت كلمة المرور؟ <Link href="/forgot-password" className="font-black text-[#17375E]">استعادة الحساب</Link>
            </p>
          </form>
        </div>
      </div>

      <style jsx>{`
        .field-input {
          height: 46px;
          width: 100%;
          border-radius: 10px;
          border: 1px solid #dde6e4;
          background: #ffffff;
          padding: 0 40px 0 12px;
          font-size: 14px;
          font-weight: 700;
          outline: none;
          transition: border-color 140ms ease, box-shadow 140ms ease;
        }
        .field-input:focus {
          border-color: #0f8f83;
          box-shadow: 0 0 0 3px rgb(15 143 131 / 16%);
        }
      `}</style>
    </main>
  )
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-black text-[#C9964A]">{title}</p>
      <p className="mt-1 text-sm font-bold text-white/85">{text}</p>
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
      className={`rounded-xl border p-4 text-right transition ${active ? 'border-[#0F8F83] bg-[#EEF6F5] text-[#17375E] shadow-sm' : 'border-[#DDE6E4] bg-white text-[#64748B] hover:border-[#0F8F83]'}`}
    >
      <Icon className="mb-2 size-5" />
      <span className="block text-sm font-black">{title}</span>
      <span className="mt-1 block text-xs font-semibold leading-5">{description}</span>
    </button>
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

function UploadBox({ name, label, required, multiple }: { name: string; label: string; required?: boolean; multiple?: boolean }) {
  return (
    <label className="relative block min-h-36 rounded-xl border-2 border-dashed border-[#DDE6E4] bg-white p-4 text-center transition hover:border-[#0F8F83] hover:bg-[#EEF6F5]">
      {name.includes('Id') || name.includes('id') ? (
        <IdCard className="mx-auto mb-2 size-5 text-[#17375E]" />
      ) : name.includes('commercial') ? (
        <FileArchive className="mx-auto mb-2 size-5 text-[#17375E]" />
      ) : (
        <Upload className="mx-auto mb-2 size-5 text-[#17375E]" />
      )}
      <span className="block text-sm font-black text-[#102033]">{label}</span>
      <span className="mt-1 block text-xs font-semibold text-[#64748B]">PDF أو صورة</span>
      <input name={name} type="file" required={required} multiple={multiple} accept="image/*,.pdf" className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  )
}
