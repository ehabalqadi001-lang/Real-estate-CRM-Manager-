'use client'

import { useRef, useState, useTransition, type ChangeEvent, type ElementType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, FileCheck2, FileText, Layers, Loader2, MapPin, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { submitListingAction } from '@/app/marketplace/add-property/actions'
import { cn } from '@/lib/utils'

type SelectOption = { value: string; label: string }
type Project = { id: string; name: string }
type Developer = { id: string; name: string }

type Props = {
  userId: string
  projects: Project[]
  developers: Developer[]
}

const UNIT_TYPES: SelectOption[] = [
  { value: 'سكني', label: 'سكني' },
  { value: 'تجاري', label: 'تجاري' },
  { value: 'إداري', label: 'إداري' },
  { value: 'فندقي', label: 'فندقي' },
  { value: 'طبي', label: 'طبي' },
]

const FINISHING_OPTIONS: SelectOption[] = [
  { value: 'تشطيب كامل', label: 'تشطيب كامل' },
  { value: 'نصف تشطيب', label: 'نصف تشطيب' },
  { value: 'طوب أحمر', label: 'طوب أحمر' },
]

const PRICING_STRATEGIES: SelectOption[] = [
  { value: 'كاش', label: 'كاش' },
  { value: 'أقساط', label: 'أقساط' },
  { value: 'تكملة أقساط', label: 'تكملة أقساط' },
]

const STEPS = ['الصور والموقع', 'تفاصيل الوحدة', 'المحتوى التسويقي', 'السعر والمستندات']

export default function ListingForm({ projects, developers }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [aiNotice, setAiNotice] = useState<string | null>(null)
  const [generatingAI, setGeneratingAI] = useState(false)

  const [images, setImages] = useState<File[]>([])
  const [areaLocation, setAreaLocation] = useState('')
  const [projectId, setProjectId] = useState('')
  const [developerId, setDeveloperId] = useState('')
  const [detailedAddress, setDetailedAddress] = useState('')
  const [unitNumber, setUnitNumber] = useState('')

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

  const [pricingStrategy, setPricingStrategy] = useState('')
  const [listingType, setListingType] = useState<'REGULAR' | 'PREMIUM'>('REGULAR')
  const [downPayment, setDownPayment] = useState('')
  const [installmentAmount, setInstallmentAmount] = useState('')
  const [totalCashPrice, setTotalCashPrice] = useState('')
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [paymentPlanFile, setPaymentPlanFile] = useState<File | null>(null)
  const [poaFile, setPoaFile] = useState<File | null>(null)
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [masterplanFile, setMasterplanFile] = useState<File | null>(null)

  async function generateMarketing() {
    setGeneratingAI(true)
    setError(null)
    setAiNotice(null)
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
      if (!res.ok || !data.description) {
        setError(data.error ?? 'فشل إنشاء المحتوى التسويقي')
      } else {
        setMarketingDesc(data.description)
        setAiNotice(data.warning ?? null)
      }
    } catch {
      setError('فشل الاتصال بخدمة Gemini')
    } finally {
      setGeneratingAI(false)
    }
  }

  function handleSubmit() {
    setError(null)
    const fd = new FormData()
    images.forEach((img) => fd.append('images', img))
    fd.set('area_location', areaLocation)
    fd.set('project_id', projectId)
    fd.set('developer_id', developerId)
    fd.set('detailed_address', detailedAddress)
    fd.set('unit_number', unitNumber)
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
    fd.set('pricing_strategy', pricingStrategy)
    fd.set('listing_type', listingType)
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
      if (result?.error) setError(result.error)
      else router.push('/marketplace/add-property?submitted=1')
    })
  }

  function canAdvance() {
    if (step === 0) return images.length > 0 && areaLocation.trim().length > 0
    if (step === 1) {
      if (title.trim().length < 8 || !unitType) return false
      if (unitType === 'تجاري' && (!internalArea || !externalArea)) return false
      if (isRented && !rentalValue) return false
    }
    if (step === 3) {
      if (!pricingStrategy || !totalCashPrice) return false
      if (pricingStrategy !== 'كاش' && (!downPayment || !installmentAmount)) return false
    }
    return true
  }

  return (
    <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
      <StepBar current={step} />

      {error && (
        <div className="mb-5 rounded-lg border border-[#B54747]/25 bg-[#B54747]/10 px-4 py-3 text-sm font-black text-[#B54747]">
          {error}
        </div>
      )}
      {aiNotice && (
        <div className="mb-5 rounded-lg border border-[#C9964A]/30 bg-[#FFF8EC] px-4 py-3 text-sm font-black text-[#7C531B]">
          {aiNotice}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-5">
          <SectionTitle>صور الوحدة</SectionTitle>
          <ImageUploadGrid files={images} onChange={setImages} />

          <SectionTitle>الموقع والمشروع</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="المنطقة / الموقع *">
              <Input value={areaLocation} onChange={(e) => setAreaLocation(e.target.value)} placeholder="مثال: التجمع الخامس" className="h-10 border-[#DDE6E4]" />
            </Field>
            <Field label="المشروع">
              <Select value={projectId} onValueChange={(value) => value && setProjectId(value)}>
                <SelectTrigger className="h-10 border-[#DDE6E4]"><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="المطور">
              <Select value={developerId} onValueChange={(value) => value && setDeveloperId(value)}>
                <SelectTrigger className="h-10 border-[#DDE6E4]"><SelectValue placeholder="اختر المطور" /></SelectTrigger>
                <SelectContent>{developers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="رقم الوحدة">
              <Input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="A-304" className="h-10 border-[#DDE6E4]" />
            </Field>
          </div>
          <Field label="العنوان التفصيلي">
            <TextArea value={detailedAddress} onChange={setDetailedAddress} rows={3} placeholder="الطابق، الدور، البرج، أقرب علامة..." />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <SectionTitle>تفاصيل الوحدة</SectionTitle>
          <Field label="عنوان الإعلان *" hint="8 أحرف على الأقل">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="شقة متشطبة 3 غرف في التجمع الخامس" className="h-10 border-[#DDE6E4]" />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="نوع الوحدة *">
              <Select value={unitType} onValueChange={(value) => value && setUnitType(value)}>
                <SelectTrigger className="h-10 border-[#DDE6E4]"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                <SelectContent>{UNIT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="عدد الغرف"><Input type="number" min={0} value={rooms} onChange={(e) => setRooms(e.target.value)} className="h-10 border-[#DDE6E4]" /></Field>
            <Field label="عدد الحمامات"><Input type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="h-10 border-[#DDE6E4]" /></Field>
            <Field label="المساحة الإجمالية م²"><Input type="number" min={1} value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} className="h-10 border-[#DDE6E4]" /></Field>
            {unitType === 'تجاري' && (
              <>
                <Field label="المساحة الداخلية م² *"><Input type="number" min={1} value={internalArea} onChange={(e) => setInternalArea(e.target.value)} className="h-10 border-[#DDE6E4]" /></Field>
                <Field label="المساحة الخارجية م² *"><Input type="number" min={1} value={externalArea} onChange={(e) => setExternalArea(e.target.value)} className="h-10 border-[#DDE6E4]" /></Field>
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="المميزات"><FeatureToggle value={features} onChange={setFeatures} /></Field>
            <Field label="مفروشة"><BoolToggle value={isFurnished} onChange={setIsFurnished} /></Field>
          </div>

          <Field label="التشطيب">
            <Select value={finishing} onValueChange={(value) => value && setFinishing(value)}>
              <SelectTrigger className="h-10 border-[#DDE6E4]"><SelectValue placeholder="اختر التشطيب" /></SelectTrigger>
              <SelectContent>{FINISHING_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="هل الوحدة مؤجرة حاليا؟"><BoolToggle value={isRented} onChange={setIsRented} yes="نعم - مؤجرة" no="لا - شاغرة" /></Field>
            {isRented && <Field label="قيمة الإيجار *"><Input type="number" min={0} value={rentalValue} onChange={(e) => setRentalValue(e.target.value)} className="h-10 border-[#DDE6E4]" /></Field>}
          </div>

          <Field label="تفاصيل مميزة">
            <TextArea value={specialNotes} onChange={setSpecialNotes} rows={4} placeholder="أي مميزات خاصة تريد إبرازها للمشتري..." />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <SectionTitle>المحتوى التسويقي بالذكاء الاصطناعي</SectionTitle>
          <div className="rounded-lg border border-[#C9964A]/40 bg-[#FFF8EC] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black text-[#102033]">إنشاء وصف احترافي للوحدة</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">يعتمد Gemini على بيانات الوحدة التي أدخلتها ويمكنك تعديل النص قبل الإرسال.</p>
              </div>
              <Button type="button" onClick={generateMarketing} disabled={generatingAI} className="bg-[#C9964A] text-white hover:bg-[#b07e36]">
                {generatingAI ? <Loader2 className="ms-1 size-4 animate-spin" /> : <Sparkles className="ms-1 size-4" />}
                {generatingAI ? 'جاري الإنشاء...' : 'إنشاء محتوى تسويقي بـ Gemini'}
              </Button>
            </div>
            <TextArea value={marketingDesc} onChange={setMarketingDesc} rows={8} placeholder="سيظهر الوصف التسويقي هنا..." className="mt-4 border-[#C9964A]/30" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <SectionTitle>Marketplace visibility</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setListingType('REGULAR')}
              className={cn('rounded-lg border p-4 text-right transition', listingType === 'REGULAR' ? 'border-[#27AE60] bg-[#27AE60]/10 text-[#14532D]' : 'border-[#DDE6E4] bg-white text-[#4B6175]')}
            >
              <span className="block text-sm font-black">Regular ad</span>
              <span className="mt-1 block text-xs font-bold">Costs the configured Regular points amount.</span>
            </button>
            <button
              type="button"
              onClick={() => setListingType('PREMIUM')}
              className={cn('rounded-lg border p-4 text-right transition', listingType === 'PREMIUM' ? 'border-[#C9964A] bg-[#FFF8EC] text-[#7C531B]' : 'border-[#DDE6E4] bg-white text-[#4B6175]')}
            >
              <span className="block text-sm font-black">Premium ad</span>
              <span className="mt-1 block text-xs font-bold">Ranks before Regular ads and spends Premium points.</span>
            </button>
          </div>

          <SectionTitle>استراتيجية التسعير</SectionTitle>
          <Field label="طريقة البيع *">
            <Select value={pricingStrategy} onValueChange={(value) => value && setPricingStrategy(value)}>
              <SelectTrigger className="h-10 border-[#DDE6E4]"><SelectValue placeholder="اختر طريقة البيع" /></SelectTrigger>
              <SelectContent>{PRICING_STRATEGIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="السعر الإجمالي كاش *"><Input type="number" min={0} value={totalCashPrice} onChange={(e) => setTotalCashPrice(e.target.value)} className="h-10 border-[#DDE6E4]" /></Field>
            {pricingStrategy !== 'كاش' && pricingStrategy && (
              <>
                <Field label="المقدم *"><Input type="number" min={0} value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className="h-10 border-[#DDE6E4]" /></Field>
                <Field label="قيمة القسط *"><Input type="number" min={0} value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} className="h-10 border-[#DDE6E4]" /></Field>
              </>
            )}
          </div>

          <SectionTitle>مستندات الوحدة</SectionTitle>
          <div className="grid gap-3 md:grid-cols-3">
            <FileUploadField label="عقد الوحدة" name="contract_file" accept=".pdf,.jpg,.jpeg,.png,.webp" icon={FileText} file={contractFile} onChange={setContractFile} />
            <FileUploadField label="نظام السداد" name="payment_plan_file" accept=".pdf,.jpg,.jpeg,.png,.webp" icon={FileText} file={paymentPlanFile} onChange={setPaymentPlanFile} />
            <FileUploadField label="التوكيلات" name="poa_file" accept=".pdf,.jpg,.jpeg,.png,.webp" icon={FileCheck2} file={poaFile} onChange={setPoaFile} />
          </div>

          <SectionTitle>الملفات الهندسية</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            <FileUploadField label="Layout" name="layout_file" accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg" icon={Layers} file={layoutFile} onChange={setLayoutFile} />
            <FileUploadField label="Masterplan" name="masterplan_file" accept=".pdf,.jpg,.jpeg,.png,.webp" icon={MapPin} file={masterplanFile} onChange={setMasterplanFile} />
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#DDE6E4] pt-5">
        <Button type="button" variant="outline" className="border-[#DDE6E4]" onClick={() => { setError(null); setStep((s) => Math.max(0, s - 1)) }} disabled={step === 0}>السابق</Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" disabled={!canAdvance()} onClick={() => { setError(null); setStep((s) => s + 1) }} className="bg-[#17375E] text-white hover:bg-[#102033] disabled:opacity-40">التالي</Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={pending || !canAdvance()} className="bg-[#17375E] text-white hover:bg-[#102033]">
            {pending ? <Loader2 className="ms-1 size-4 animate-spin" /> : <FileCheck2 className="ms-1 size-4" />}
            {pending ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
          </Button>
        )}
      </div>
    </div>
  )
}

function StepBar({ current }: { current: number }) {
  return (
    <div className="mb-8 grid grid-cols-4 gap-2">
      {STEPS.map((label, index) => (
        <div key={label} className={cn('rounded-lg border px-3 py-2 text-center text-xs font-black', index === current ? 'border-[#17375E] bg-[#17375E] text-white' : index < current ? 'border-[#0F8F83] bg-[#EEF6F5] text-[#0F8F83]' : 'border-[#DDE6E4] bg-[#FBFCFA] text-[#64748B]')}>
          <span className="block text-sm">{index + 1}</span>
          <span className="mt-1 block">{label}</span>
        </div>
      ))}
    </div>
  )
}

function ImageUploadGrid({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handlePick(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    onChange([...files, ...picked].slice(0, 12))
    event.target.value = ''
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-[#DDE6E4] bg-[#FBFCFA]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(files.filter((_, i) => i !== index))} className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-[#B54747] text-white opacity-0 transition group-hover:opacity-100">
              <X className="size-3" />
            </button>
          </div>
        ))}
        {files.length < 12 && (
          <button type="button" onClick={() => inputRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#DDE6E4] bg-[#FBFCFA] transition hover:border-[#17375E] hover:bg-[#EEF6F5]">
            <Camera className="size-5 text-[#17375E]" />
            <span className="text-xs font-black text-[#64748B]">إضافة</span>
          </button>
        )}
      </div>
      <p className="mt-2 text-xs font-bold text-[#64748B]">{files.length}/12 صورة - JPG, PNG, WEBP</p>
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
    </div>
  )
}

function FileUploadField({ label, name, accept, icon: Icon, file, onChange }: { label: string; name: string; accept: string; icon: ElementType; file: File | null; onChange: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-black text-[#102033]">{label}</Label>
      <button type="button" onClick={() => inputRef.current?.click()} className={cn('flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-right text-sm font-bold transition', file ? 'border-[#0F8F83] bg-[#EEF6F5] text-[#0F8F83]' : 'border-dashed border-[#DDE6E4] bg-[#FBFCFA] text-[#64748B] hover:border-[#17375E]')}>
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{file ? file.name : 'اختر ملف'}</span>
      </button>
      <input ref={inputRef} type="file" name={name} accept={accept} className="hidden" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
    </div>
  )
}

function FeatureToggle({ value, onChange }: { value: 'ROOF' | 'GARDEN' | 'NONE'; onChange: (value: 'ROOF' | 'GARDEN' | 'NONE') => void }) {
  const options = [
    { value: 'ROOF' as const, label: 'روف' },
    { value: 'GARDEN' as const, label: 'جاردن' },
    { value: 'NONE' as const, label: 'لا يوجد' },
  ]
  return <Segmented options={options} value={value} onChange={onChange} />
}

function BoolToggle({ value, onChange, yes = 'نعم', no = 'لا' }: { value: boolean; onChange: (value: boolean) => void; yes?: string; no?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onChange(true)} className={toggleClass(value)}>{yes}</button>
      <button type="button" onClick={() => onChange(false)} className={toggleClass(!value)}>{no}</button>
    </div>
  )
}

function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange(option.value)} className={toggleClass(value === option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

function toggleClass(active: boolean) {
  return cn('rounded-lg border px-3 py-2 text-sm font-black transition', active ? 'border-[#17375E] bg-[#17375E] text-white' : 'border-[#DDE6E4] bg-white text-[#4B6175] hover:border-[#17375E]')
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="block text-sm font-black text-[#102033]">{label}</Label>
      {children}
      {hint && <p className="text-xs font-bold text-[#64748B]">{hint}</p>}
    </div>
  )
}

function TextArea({ value, onChange, rows, placeholder, className }: { value: string; onChange: (value: string) => void; rows: number; placeholder?: string; className?: string }) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={cn('w-full resize-none rounded-lg border border-[#DDE6E4] bg-white px-3 py-2 text-sm font-semibold leading-7 outline-none focus:ring-2 focus:ring-[#0F8F83]/30', className)}
    />
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="border-b border-[#DDE6E4] pb-2 text-sm font-black text-[#17375E]">{children}</h3>
}
