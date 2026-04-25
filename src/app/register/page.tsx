'use client'

import { useMemo, useState, type ElementType, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowRight, BadgeCheck, BriefcaseBusiness,
  Building2, CheckCircle2, FileArchive, FileText, IdCard,
  LockKeyhole, Mail, Phone, ShieldCheck, Upload, User, UsersRound,
} from 'lucide-react'
import { registerAction } from '@/app/login/actions'
import { stagger, fadeUp, slideInLeft, slideInRight, buttonMotion, scaleIn, cardMotion } from '@/lib/motion'

type PartnerAccountType = 'broker_freelancer' | 'company'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('role') === 'partner' ? 'partner' : 'client'
  const [accountType, setAccountType] = useState<PartnerAccountType>('broker_freelancer')
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<{ message: string; details: string } | null>(null)
  const isAlreadyRegistered = `${errorState?.message ?? ''} ${errorState?.details ?? ''}`.toLowerCase().includes('registered')

  const copy = useMemo(() => {
    if (mode === 'partner') return {
      eyebrow: 'FAST PARTNERS NETWORK',
      title: 'Join Our Elite Broker & Company Network',
      subtitle: 'Get access to exclusive inventory, priority leads, and a dedicated account manager.',
      button: 'Submit Partnership Application',
      accentColor: '#f59e0b',
    }
    return {
      eyebrow: 'FAST INVESTMENT',
      title: 'Start Your Investment Journey',
      subtitle: 'Create a client account to track your property search, communicate securely, and receive expert guidance.',
      button: 'Create Client Account',
      accentColor: '#10b981',
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
      setErrorState({ message: 'Connection error — please try again', details: redirect.message ?? 'Unknown error' })
      setLoading(false)
    }
  }

  return (
    <div className="fi-login-root min-h-screen" dir="ltr">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${copy.accentColor}44 0%, transparent 65%)` }}
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #2563eb44 0%, transparent 65%)' }}
        />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:py-12">

        {/* ── LEFT HERO SIDEBAR ─────────────────────────────── */}
        <motion.aside
          variants={slideInLeft}
          initial="hidden"
          animate="show"
          className="fi-register-hero overflow-hidden rounded-3xl p-7 text-white lg:sticky lg:top-8"
        >
          {/* Grid pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />

          <div className="relative z-10">
            {/* Eyebrow badge */}
            <motion.div variants={fadeUp} initial="hidden" animate="show"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: copy.accentColor }}>
              <BadgeCheck className="size-3.5" />
              {copy.eyebrow}
            </motion.div>

            <motion.h1 variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.07 }}
              className="mt-5 text-3xl font-black leading-tight">
              {copy.title}
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.12 }}
              className="mt-4 text-sm font-semibold leading-7 text-white/65">
              {copy.subtitle}
            </motion.p>

            {/* Info cards */}
            <motion.div variants={stagger} initial="hidden" animate="show" transition={{ delay: 0.18 }}
              className="mt-7 space-y-3">
              {mode === 'partner' ? (
                <>
                  <InfoCard icon={ShieldCheck} title="Verified & Approved" text="Documents reviewed by our team within 24 hours before account activation." color={copy.accentColor} />
                  <InfoCard icon={BriefcaseBusiness} title="BRM Integration" text="Automatic connection to Broker Relationship Management, commissions, and pipeline stages." color={copy.accentColor} />
                  <InfoCard icon={CheckCircle2} title="Dedicated Account Manager" text="Every partner gets a named account manager for priority support and deal flow." color={copy.accentColor} />
                </>
              ) : (
                <>
                  <InfoCard icon={ShieldCheck} title="Secure & Private" text="Your data is encrypted and shared only with your assigned advisor." color={copy.accentColor} />
                  <InfoCard icon={Building2} title="Premium Inventory" text="Access off-market listings and exclusive developer offers." color={copy.accentColor} />
                  <InfoCard icon={CheckCircle2} title="Expert Guidance" text="Matched with a sales specialist based on your investment profile." color={copy.accentColor} />
                </>
              )}
            </motion.div>

            {/* Trust signals */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.4 }}
              className="mt-7 flex flex-wrap gap-2 border-t border-white/10 pt-5">
              {['🔒 SSL Secured', '✓ Reviewed in 24h', '🏆 200+ Active Partners'].map((trust) => (
                <span key={trust} className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[11px] font-bold text-white/60">{trust}</span>
              ))}
            </motion.div>
          </div>
        </motion.aside>

        {/* ── RIGHT FORM AREA ───────────────────────────────── */}
        <motion.div variants={slideInRight} initial="hidden" animate="show" className="space-y-4">
          {/* Error */}
          <AnimatePresence>
            {errorState && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-red-700">{errorState.message}</p>
                    <p className="mt-1 break-words text-xs font-semibold text-red-400" dir="ltr">{errorState.details}</p>
                    {isAlreadyRegistered && (
                      <Link href="/forgot-password" className="mt-3 inline-flex h-9 items-center rounded-xl bg-red-600 px-4 text-xs font-black text-white hover:bg-red-700">
                        Recover Password →
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form card */}
          <motion.form
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
            onSubmit={handleSubmit}
            className="fi-login-card rounded-3xl p-7"
            encType="multipart/form-data"
          >
            <input type="hidden" name="registrationMode" value={mode} />
            <input type="hidden" name="accountType" value={mode === 'client' ? 'client' : accountType} />

            {/* Account type toggle (partner only) */}
            {mode === 'partner' && (
              <div className="mb-7">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Account Type</p>
                <h2 className="mb-4 text-xl font-black text-slate-900">Choose your partner type</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    active={accountType === 'broker_freelancer'}
                    icon={UsersRound}
                    title="Broker / Freelancer"
                    description="Individual broker — manage your own listings, commissions, and client relationships."
                    onClick={() => setAccountType('broker_freelancer')}
                    color="#2563eb"
                  />
                  <ChoiceCard
                    active={accountType === 'company'}
                    icon={BriefcaseBusiness}
                    title="Company Account"
                    description="Brokerage company with a manager, multiple agents, and full accreditation files."
                    onClick={() => setAccountType('company')}
                    color="#f59e0b"
                  />
                </div>
              </div>
            )}

            {/* Form section header */}
            <div className="mb-6 border-b border-slate-100 pb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                {mode === 'partner' ? 'Your Details' : 'Personal Information'}
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-900">
                {mode === 'partner'
                  ? accountType === 'broker_freelancer' ? 'Broker Information' : 'Company Information'
                  : 'Create Your Client Account'}
              </h3>
            </div>

            {/* Field sections */}
            {mode === 'client' ? (
              <ClientFields />
            ) : accountType === 'broker_freelancer' ? (
              <BrokerFields />
            ) : (
              <CompanyFields />
            )}

            {/* Submit */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.button
                type="submit"
                disabled={loading}
                {...buttonMotion}
                className="fi-cta-btn flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="size-4 rounded-full border-2 border-white/30 border-t-white" />
                    Processing…
                  </>
                ) : (
                  <>
                    {copy.button}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </motion.button>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                <CheckCircle2 className="size-4 text-emerald-500" />
                File-secure upload
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-center text-sm font-semibold text-slate-500 sm:grid-cols-2">
              <p>Already have an account?{' '}
                <Link href="/login" className="font-black text-blue-600 hover:underline">Sign In</Link>
              </p>
              <p>Forgot password?{' '}
                <Link href="/forgot-password" className="font-black text-blue-600 hover:underline">Recover Account</Link>
              </p>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────── */

function InfoCard({ icon: Icon, title, text, color }: { icon: ElementType; title: string; text: string; color: string }) {
  return (
    <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}25` }}>
        <Icon className="size-4" style={{ color }} />
      </span>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-white/55">{text}</p>
      </div>
    </motion.div>
  )
}

function ChoiceCard({ active, icon: Icon, title, description, onClick, color }: {
  active: boolean; icon: ElementType; title: string; description: string; onClick: () => void; color: string
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={cardMotion}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      className={`rounded-2xl border-2 p-4 text-left transition-colors ${
        active
          ? 'border-blue-400 bg-blue-50 shadow-sm shadow-blue-100'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${active ? 'bg-blue-100' : 'bg-slate-100'}`}>
        <Icon className="size-4" style={{ color: active ? color : '#64748b' }} />
      </div>
      <p className="text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{description}</p>
      {active && (
        <motion.div variants={scaleIn} initial="hidden" animate="show"
          className="mt-2 flex items-center gap-1 text-[11px] font-black text-blue-600">
          <CheckCircle2 className="size-3.5" /> Selected
        </motion.div>
      )}
    </motion.button>
  )
}

/* ─── Field wrapper ────────────────────────────────────── */
function FloatField({
  id, name, type = 'text', label, icon: Icon, required, minLength, dir,
}: {
  id: string; name: string; type?: string; label: string; icon: ElementType; required?: boolean; minLength?: number; dir?: string
}) {
  return (
    <div className="fi-float-wrap">
      <span className="fi-float-icon">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        dir={dir}
        placeholder=" "
        className="fi-float-input"
      />
      <label htmlFor={id} className="fi-float-label">
        {label}
      </label>
    </div>
  )
}

/* ─── Client fields ─────────────────────────────────────── */
function ClientFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FloatField id="fullName" name="fullName" label="Full Name" icon={User} required />
      <FloatField id="phone" name="phone" label="Phone Number" icon={Phone} required dir="ltr" />
      <FloatField id="region" name="region" label="Region / Governorate" icon={Building2} required />
      <FloatField id="email" name="email" type="email" label="Email Address" icon={Mail} required dir="ltr" />
      <div className="sm:col-span-2">
        <FloatField id="password" name="password" type="password" label="Password (min. 8 characters)" icon={LockKeyhole} required minLength={8} dir="ltr" />
      </div>
    </div>
  )
}

/* ─── Broker fields ─────────────────────────────────────── */
function BrokerFields() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatField id="firstName" name="firstName" label="First Name" icon={User} required />
        <FloatField id="lastName" name="lastName" label="Last Name" icon={User} required />
        <FloatField id="email" name="email" type="email" label="Email Address" icon={Mail} required dir="ltr" />
        <FloatField id="phone" name="phone" label="Phone Number" icon={Phone} required dir="ltr" />
        <FloatField id="password" name="password" type="password" label="Password" icon={LockKeyhole} required minLength={8} dir="ltr" />
        <FloatField id="confirmPassword" name="confirmPassword" type="password" label="Confirm Password" icon={LockKeyhole} required minLength={8} dir="ltr" />
      </div>
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Identity Documents</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <UploadBox name="idFront" label="National ID — Front" icon={IdCard} required />
          <UploadBox name="idBack" label="National ID — Back" icon={IdCard} required />
        </div>
      </div>
    </div>
  )
}

/* ─── Company fields ─────────────────────────────────────── */
function CompanyFields() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatField id="companyName" name="companyName" label="Company Name" icon={Building2} required />
        <FloatField id="managerName" name="managerName" label="Manager Name" icon={User} required />
        <FloatField id="managerPhone" name="managerPhone" label="Manager Phone" icon={Phone} required dir="ltr" />
        <FloatField id="ownerPhone" name="ownerPhone" label="Owner Phone" icon={Phone} required dir="ltr" />
        <FloatField id="email" name="email" type="email" label="Email Address" icon={Mail} required dir="ltr" />
        <FloatField id="facebookUrl" name="facebookUrl" type="url" label="Facebook Page URL" icon={FileText} dir="ltr" />
        <FloatField id="password" name="password" type="password" label="Password" icon={LockKeyhole} required minLength={8} dir="ltr" />
        <FloatField id="confirmPassword" name="confirmPassword" type="password" label="Confirm Password" icon={LockKeyhole} required minLength={8} dir="ltr" />
      </div>
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Company Documents</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <UploadBox name="commercialRegisterFiles" label="Commercial Register (up to 3)" icon={FileArchive} required multiple />
          <UploadBox name="taxCardImage" label="Tax Card" icon={FileText} required />
          <UploadBox name="ownerIdImage" label="Owner National ID" icon={IdCard} required />
          <UploadBox name="vatCertificate" label="VAT Certificate (if applicable)" icon={Upload} />
        </div>
      </div>
    </div>
  )
}

/* ─── Upload zone ────────────────────────────────────────── */
function UploadBox({ name, label, icon: Icon, required, multiple }: {
  name: string; label: string; icon: ElementType; required?: boolean; multiple?: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <motion.label
      className={`fi-upload-zone relative flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
        isDragging ? 'border-blue-400 bg-blue-50' : fileName ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'
      }`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={() => setIsDragging(false)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <AnimatePresence mode="wait">
        {fileName ? (
          <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex flex-col items-center">
            <CheckCircle2 className="mb-2 size-6 text-emerald-500" />
            <span className="text-xs font-black text-emerald-700 line-clamp-2">{fileName}</span>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex flex-col items-center">
            <Icon className="mb-2 size-6 text-slate-400" />
            <span className="text-xs font-black text-slate-600">{label}</span>
            <span className="mt-1 text-[11px] font-semibold text-slate-400">PDF or image · Click or drag</span>
            {required && <span className="mt-1 text-[10px] font-black uppercase text-blue-500">Required</span>}
          </motion.div>
        )}
      </AnimatePresence>
      <input
        name={name}
        type="file"
        required={required}
        multiple={multiple}
        accept="image/*,.pdf"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
    </motion.label>
  )
}
