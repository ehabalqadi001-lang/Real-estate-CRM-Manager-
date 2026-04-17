'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { submitListingAction } from '@/app/marketplace/add-property/actions'
import {
  Camera,
  FileCheck2,
  FileText,
  Layers,
  Loader2,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string }

interface Project { id: string; name: string }
interface Developer { id: string; name: string }

interface Props {
  userId: string
  projects: Project[]
  developers: Developer[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UNIT_TYPES: SelectOption[] = [
  { value: 'سكني',   label: 'سكني' },
  { value: 'تجاري',  label: 'تجاري' },
  { value: 'إداري',  label: 'إداري' },
  { value: 'فندقي',  label: 'فندقي' },
  { value: 'طبي',    label: 'طبي' },
]

const FINISHING_OPTIONS: SelectOption[] = [
  { value: 'تشطيب كامل', label: 'تشطيب كامل' },
  { value: 'نصف تشطيب',  label: 'نصف تشطيب' },
  { value: 'طوب أحمر',   label: 'طوب أحمر' },
]

const PRICING_STRATEGIES: SelectOption[] = [
  { value: 'كاش',          label: 'كاش' },
  { value: 'أقساط',        label: 'أقساط' },
  { value: 'تكملة أقساط',  label: 'تكملة أقساط' },
]

const STEPS = ['الموقع والمشروع', 'تفاصيل الوحدة', 'الأسعار والمستندات']

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center gap-0">
      {STEPS.map((label, i) => (
        <div key={i} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            {i > 0 && (
              <div
                className={cn(
                  'h-0.5 flex-1 transition-colors duration-300',
                  i <= current ? 'bg-[#17375E]' : 'bg-[#DDE6E4]',
                )}
              />
            )}
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-sm font-black transition-colors duration-300',
                i < current
                  ? 'bg-[#0F8F83] text-white'
                  : i === current
                  ? 'bg-[#17375E] text-white ring-4 ring-[#17375E]/20'
                  : 'bg-[#EEF6F5] text-[#64748B]',
              )}
            >
              {i < current ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 transition-colors duration-300',
                  i < current ? 'bg-[#17375E]' : 'bg-[#DDE6E4]',
                )}
              />
            )}
          </div>
          <span
            className={cn(
              'mt-2 text-center text-xs font-bold',
              i === current ? 'text-[#17375E]' : 'text-[#64748B]',
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Image Upload Grid ────────────────────────────────────────────────────────

function ImageUploadGrid({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    const merged = [...files, ...picked].slice(0, 12)
    onChange(merged)
    e.target.value = ''
  }

  const remove = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {files.map((f, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-[#DDE6E4] bg-[#FBFCFA]">
            <img
              src={URL.createObjectURL(f)}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-[#B54747] text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {files.length < 12 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#DDE6E4] bg-[#FBFCFA] transition hover:border-[#17375E] hover:bg-[#EEF6F5]"
          >
            <Camera className="size-5 text-[#17375E]" />
            <span className="text-xs font-bold text-[#64748B]">إضافة</span>
          </button>
        )}
      </div>
      <p className="mt-2 text-xs font-semibold text-[#64748B]">
        {files.length}/12 صورة — JPG, PNG, WEBP (حد أقصى 5MB لكل صورة)
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handlePick}
      />
    </div>
  )
}

// ─── File Upload Field ────────────────────────────────────────────────────────

function FileUploadField({
  label,
  name,
  accept,
  icon: Icon,
  file,
  onChange,
}: {
  label: string
  name: string
  accept: string
  icon: React.ElementType
  file: File | null
  onChange: (f: File | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-bold text-[#102033]">{label}</Label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn(
          'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-right text-sm font-semibold transition',
          file
            ? 'border-[#0F8F83] bg-[#EEF6F5] text-[#0F8F83]'
            : 'border-dashed border-[#DDE6E4] bg-[#FBFCFA] text-[#64748B] hover:border-[#17375E] hover:bg-white',
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{file ? file.name : 'اختر ملف...'}</span>
        {file && (
          <X
            className="ms-auto size-4 shrink-0 text-[#B54747]"
            onClick={(e) => { e.stopPropagation(); onChange(null) }}
          />
        )}
      </button>
      <input
        ref={ref}
        type="file"
        name={name}
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

// ─── Feature Toggle ───────────────────────────────────────────────────────────

function FeatureToggle({
  value,
  onChange,
}: {
  value: 'ROOF' | 'GARDEN' | 'NONE'
  onChange: (v: 'ROOF' | 'GARDEN' | 'NONE') => void
}) {
  const opts = [
    { v: 'ROOF' as const,   label: 'روف' },
    { v: 'GARDEN' as const, label: 'جاردن' },
    { v: 'NONE' as const,   label: 'لا يوجد' },
  ]
  return (
    <div className="flex gap-2">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition',
            value === o.v
              ? 'border-[#17375E] bg-[#17375E] text-white'
              : 'border-[#DDE6E4] bg-white text-[#4B6175] hover:border-[#17375E]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Bool Toggle ─────────────────────────────────────────────────────────────

function BoolToggle({
  value,
  onChange,
  yes = 'نعم',
  no = 'لا',
}: {
  value: boolean
  onChange: (v: boolean) => void
  yes?: string
  no?: string
}) {
  return (
    <div className="flex gap-2">
      {[true, false].map((b) => (
        <button
          key={String(b)}
          type="button"
          onClick={() => onChange(b)}
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition',
            value === b
              ? 'border-[#0F8F83] bg-[#0F8F83] text-white'
              : 'border-[#DDE6E4] bg-white text-[#4B6175] hover:border-[#0F8F83]',
          )}
        >
          {b ? yes : no}
        </button>
      ))}
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="block text-sm font-bold text-[#102033]">{label}</Label>
      {children}
      {hint && <p className="text-xs font-semibold text-[#64748B]">{hint}</p>}
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function ListingForm({ userId, projects, developers }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [generatingAI, setGeneratingAI] = useState(false)

  // ── State for all 21 field groups ──
  const [images, setImages] = useState<File[]>([])

  // Step 1 — Location & Project
  const [areaLocation, setAreaLocation] = useState('')
  const [projectId, setProjectId] = useState('')
  const [developerId, setDeveloperId] = useState('')
  const [detailedAddress, setDetailedAddress] = useState('')
  const [unitNumber, setUnitNumber] = useState('')

  // Step 2 — Unit Details
  const [title, setTitle] = useState('')
  const [rooms, setRooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [areaSqm, setAreaSqm] = useState('')
  const [features, setFeatures] = useState<'ROOF' | 'GARDEN' | 'NONE'>('NONE')
  const [finishing, setFinishing] = useState('')
  const [isFurnished, setIsFurnished] = useState(false)
  const [unitType, setUnitType] = useState('')
  const [internalArea, setInternalArea] = useState('')
  const [externalArea, setExternalArea] = useState('')
  const [isRented, setIsRented] = useState(false)
  const [rentalValue, setRentalValue] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [marketingDesc, setMarketingDesc] = useState('')

  // Step 3 — Pricing, Docs, Arch
  const [pricingStrategy, setPricingStrategy] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [installmentAmount, setInstallmentAmount] = useState('')
  const [totalCashPrice, setTotalCashPrice] = useState('')

  const [contractFile, setContractFile] = useState<File | null>(null)
  const [paymentPlanFile, setPaymentPlanFile] = useState<File | null>(null)
  const [poaFile, setPoaFile] = useState<File | null>(null)
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [masterplanFile, setMasterplanFile] = useState<File | null>(null)

  // ── AI Content Generation ─────────────────────────────────────────────────

  const generateMarketing = async () => {
    setGeneratingAI(true)
    try {
      const selectedProject = projects.find((p) => p.id === projectId)
      const selectedDeveloper = developers.find((d) => d.id === developerId)
      const res = await fetch('/api/marketplace/generate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          unit_type: unitType,
          area_sqm: areaSqm,
          rooms,
          bathrooms,
          finishing,
          is_furnished: isFurnished,
          features,
          pricing_strategy: pricingStrategy,
          total_cash_price: totalCashPrice,
          down_payment: downPayment,
          installment_amount: installmentAmount,
          area_location: areaLocation,
          project_name: selectedProject?.name,
          developer_name: selectedDeveloper?.name,
          is_rented: isRented,
          rental_value: rentalValue,
          internal_area_sqm: internalArea,
          external_area_sqm: externalArea,
          special_notes: specialNotes,
        }),
      })
      const data = await res.json()
      if (data.description) setMarketingDesc(data.description)
      else setError(data.error ?? 'فشل إنشاء المحتوى')
    } catch {
      setError('فشل الاتصال بـ Gemini')
    } finally {
      setGeneratingAI(false)
    }
  }

  // ── Form Submit ───────────────────────────────────────────────────────────

  const handleSubmit = () => {
    setError(null)
    const fd = new FormData()

    // images
    images.forEach((img) => fd.append('images', img))

    // step 1
    fd.set('area_location', areaLocation)
    fd.set('project_id', projectId)
    fd.set('developer_id', developerId)
    fd.set('detailed_address', detailedAddress)
    fd.set('unit_number', unitNumber)

    // step 2
    fd.set('title', title)
    fd.set('rooms', rooms)
    fd.set('bathrooms', bathrooms)
    fd.set('area_sqm', areaSqm)
    fd.set('features', features)
    fd.set('finishing', finishing)
    fd.set('is_furnished', String(isFurnished))
    fd.set('unit_type', unitType)
    fd.set('internal_area_sqm', internalArea)
    fd.set('external_area_sqm', externalArea)
    fd.set('is_rented', String(isRented))
    fd.set('rental_value', rentalValue)
    fd.set('special_notes', specialNotes)
    fd.set('marketing_description', marketingDesc)

    // step 3
    fd.set('pricing_strategy', pricingStrategy)
    fd.set('down_payment', downPayment)
    fd.set('installment_amount', installmentAmount)
    fd.set('total_cash_price', totalCashPrice)

    if (contractFile) fd.set('contract_file', contractFile)
    if (paymentPlanFile) fd.set('payment_plan_file', paymentPlanFile)
    if (poaFile) fd.set('poa_file', poaFile)
    if (layoutFile) fd.set('layout_file', layoutFile)
    if (masterplanFile) fd.set('masterplan_file', masterplanFile)

    startTransition(async () => {
      const result = await submitListingAction(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/marketplace/add-property?submitted=1')
      }
    })
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  const canAdvance = () => {
    if (step === 0) return areaLocation.trim().length > 0
    if (step === 1) return title.trim().length >= 5 && unitType.length > 0
    return true
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-[#DDE6E4] bg-white p-6 shadow-sm">
      <StepBar current={step} />

      {error && (
        <div className="mb-5 rounded-lg border border-[#B54747]/25 bg-[#B54747]/10 px-4 py-3 text-sm font-bold text-[#B54747]">
          {error}
        </div>
      )}

      {/* ─── STEP 0: Location & Project ─────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <SectionTitle>صور الوحدة</SectionTitle>
          <ImageUploadGrid files={images} onChange={setImages} />

          <SectionTitle className="pt-2">الموقع والمشروع</SectionTitle>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="المنطقة / الموقع *">
              <Input
                value={areaLocation}
                onChange={(e) => setAreaLocation(e.target.value)}
                placeholder="مثال: التجمع الخامس، مدينة نصر"
                className="h-10 border-[#DDE6E4]"
              />
            </Field>

            <Field label="المشروع">
              <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
                <SelectTrigger className="h-10 border-[#DDE6E4]">
                  <SelectValue placeholder="اختر المشروع..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="المطور">
              <Select value={developerId} onValueChange={(v) => v && setDeveloperId(v)}>
                <SelectTrigger className="h-10 border-[#DDE6E4]">
                  <SelectValue placeholder="اختر المطور..." />
                </SelectTrigger>
                <SelectContent>
                  {developers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="رقم الوحدة">
              <Input
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="مثال: A-304"
                className="h-10 border-[#DDE6E4]"
              />
            </Field>
          </div>

          <Field label="العنوان التفصيلي">
            <textarea
              value={detailedAddress}
              onChange={(e) => setDetailedAddress(e.target.value)}
              rows={3}
              placeholder="الطابق، الدور، البرج، أقرب معلم..."
              className="w-full resize-none rounded-lg border border-[#DDE6E4] bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0F8F83]/30"
            />
          </Field>
        </div>
      )}

      {/* ─── STEP 1: Unit Details ────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <SectionTitle>تفاصيل الوحدة</SectionTitle>

          <Field label="عنوان الإعلان *" hint="8 أحرف على الأقل">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: شقة متشطبة 3 غرف في التجمع الخامس"
              className="h-10 border-[#DDE6E4]"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="نوع الوحدة *">
              <Select value={unitType} onValueChange={(v) => v && setUnitType(v)}>
                <SelectTrigger className="h-10 border-[#DDE6E4]">
                  <SelectValue placeholder="اختر النوع..." />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="عدد الغرف">
              <Input
                type="number"
                min={0}
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                placeholder="3"
                className="h-10 border-[#DDE6E4]"
              />
            </Field>

            <Field label="عدد الحمامات">
              <Input
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="2"
                className="h-10 border-[#DDE6E4]"
              />
            </Field>

            <Field label="المساحة الإجمالية (م²)">
              <Input
                type="number"
                min={1}
                value={areaSqm}
                onChange={(e) => setAreaSqm(e.target.value)}
                placeholder="156"
                className="h-10 border-[#DDE6E4]"
              />
            </Field>

            {unitType === 'تجاري' && (
              <>
                <Field label="المساحة الداخلية (م²)">
                  <Input
                    type="number"
                    min={1}
                    value={internalArea}
                    onChange={(e) => setInternalArea(e.target.value)}
                    placeholder="80"
                    className="h-10 border-[#DDE6E4]"
                  />
                </Field>
                <Field label="المساحة الخارجية (م²)">
                  <Input
                    type="number"
                    min={1}
                    value={externalArea}
                    onChange={(e) => setExternalArea(e.target.value)}
                    placeholder="40"
                    className="h-10 border-[#DDE6E4]"
                  />
                </Field>
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="المميزات (روف / جاردن)">
              <FeatureToggle value={features} onChange={setFeatures} />
            </Field>

            <Field label="مفروشة">
              <BoolToggle value={isFurnished} onChange={setIsFurnished} />
            </Field>
          </div>

          <Field label="التشطيب">
            <Select value={finishing} onValueChange={(v) => v && setFinishing(v)}>
              <SelectTrigger className="h-10 border-[#DDE6E4]">
                <SelectValue placeholder="اختر نوع التشطيب..." />
              </SelectTrigger>
              <SelectContent>
                {FINISHING_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="الوحدة مؤجرة حالياً">
              <BoolToggle value={isRented} onChange={setIsRented} yes="نعم — مؤجرة" no="لا — شاغرة" />
            </Field>
            {isRented && (
              <Field label="قيمة الإيجار السنوي (ج.م)">
                <Input
                  type="number"
                  min={0}
                  value={rentalValue}
                  onChange={(e) => setRentalValue(e.target.value)}
                  placeholder="120000"
                  className="h-10 border-[#DDE6E4]"
                />
              </Field>
            )}
          </div>

          <Field label="تفاصيل مميزة">
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              rows={3}
              placeholder="أي ميزات خاصة تريد إبرازها للمشتري..."
              className="w-full resize-none rounded-lg border border-[#DDE6E4] bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#0F8F83]/30"
            />
          </Field>

          {/* AI Marketing Content */}
          <div className="rounded-xl border border-[#C9964A]/40 bg-[#FFF8EC] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-[#102033]">المحتوى التسويقي</p>
                <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
                  اضغط الزر لإنشاء وصف احترافي بالذكاء الاصطناعي بناءً على البيانات المدخلة
                </p>
              </div>
              <Button
                type="button"
                onClick={generateMarketing}
                disabled={generatingAI}
                className="shrink-0 bg-[#C9964A] text-white hover:bg-[#b07e36]"
              >
                {generatingAI ? (
                  <Loader2 className="ms-1 size-4 animate-spin" />
                ) : (
                  <Sparkles className="ms-1 size-4" />
                )}
                {generatingAI ? 'جاري الإنشاء...' : 'إنشاء محتوى تسويقي بـ Gemini'}
              </Button>
            </div>
            <textarea
              value={marketingDesc}
              onChange={(e) => setMarketingDesc(e.target.value)}
              rows={6}
              placeholder="سيظهر المحتوى المُولَّد هنا — يمكنك تعديله بعد الإنشاء..."
              className="mt-3 w-full resize-none rounded-lg border border-[#C9964A]/30 bg-white px-3 py-2 text-sm font-semibold leading-7 outline-none focus:ring-2 focus:ring-[#C9964A]/30"
            />
          </div>
        </div>
      )}

      {/* ─── STEP 2: Pricing & Documents ────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <SectionTitle>استراتيجية التسعير</SectionTitle>

          <Field label="طريقة البيع">
            <Select value={pricingStrategy} onValueChange={(v) => v && setPricingStrategy(v)}>
              <SelectTrigger className="h-10 border-[#DDE6E4]">
                <SelectValue placeholder="اختر طريقة البيع..." />
              </SelectTrigger>
              <SelectContent>
                {PRICING_STRATEGIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="السعر الإجمالي كاش (ج.م)">
              <Input
                type="number"
                min={0}
                value={totalCashPrice}
                onChange={(e) => setTotalCashPrice(e.target.value)}
                placeholder="3850000"
                className="h-10 border-[#DDE6E4]"
              />
            </Field>
            {(pricingStrategy === 'أقساط' || pricingStrategy === 'تكملة أقساط') && (
              <>
                <Field label="المقدم (ج.م)">
                  <Input
                    type="number"
                    min={0}
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="500000"
                    className="h-10 border-[#DDE6E4]"
                  />
                </Field>
                <Field label="قيمة القسط الشهري (ج.م)">
                  <Input
                    type="number"
                    min={0}
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                    placeholder="25000"
                    className="h-10 border-[#DDE6E4]"
                  />
                </Field>
              </>
            )}
          </div>

          <SectionTitle className="pt-2">مستندات الوحدة (اختياري)</SectionTitle>
          <div className="grid gap-3 md:grid-cols-3">
            <FileUploadField
              label="عقد الوحدة"
              name="contract_file"
              accept=".pdf,.jpg,.jpeg,.png"
              icon={FileText}
              file={contractFile}
              onChange={setContractFile}
            />
            <FileUploadField
              label="نظام السداد"
              name="payment_plan_file"
              accept=".pdf,.jpg,.jpeg,.png"
              icon={FileText}
              file={paymentPlanFile}
              onChange={setPaymentPlanFile}
            />
            <FileUploadField
              label="التوكيلات"
              name="poa_file"
              accept=".pdf,.jpg,.jpeg,.png"
              icon={FileCheck2}
              file={poaFile}
              onChange={setPoaFile}
            />
          </div>

          <SectionTitle className="pt-2">الملفات الهندسية (اختياري)</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            <FileUploadField
              label="Layout (مخطط الوحدة)"
              name="layout_file"
              accept=".pdf,.jpg,.jpeg,.png,.dwg"
              icon={Layers}
              file={layoutFile}
              onChange={setLayoutFile}
            />
            <FileUploadField
              label="Masterplan (مخطط المشروع)"
              name="masterplan_file"
              accept=".pdf,.jpg,.jpeg,.png"
              icon={MapPin}
              file={masterplanFile}
              onChange={setMasterplanFile}
            />
          </div>
        </div>
      )}

      {/* ─── Navigation Buttons ──────────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#DDE6E4] pt-5">
        <Button
          type="button"
          variant="outline"
          className="border-[#DDE6E4]"
          onClick={() => { setError(null); setStep((s) => s - 1) }}
          disabled={step === 0}
        >
          السابق
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canAdvance()}
            onClick={() => { setError(null); setStep((s) => s + 1) }}
            className="bg-[#17375E] text-white hover:bg-[#102033] disabled:opacity-40"
          >
            التالي
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="bg-[#17375E] text-white hover:bg-[#102033]"
          >
            {pending ? (
              <Loader2 className="ms-1 size-4 animate-spin" />
            ) : (
              <FileCheck2 className="ms-1 size-4" />
            )}
            {pending ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
          </Button>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('border-b border-[#DDE6E4] pb-2 text-sm font-black text-[#17375E]', className)}>
      {children}
    </h3>
  )
}
