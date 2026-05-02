'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, UploadCloud } from 'lucide-react'
import { submitListingAction } from '@/app/marketplace/add-property/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Owner = {
  id: string
  name: string
  email: string
  role: string
}

type Option = {
  id: string
  name: string
}

type Props = {
  owners: Owner[]
  projects: Option[]
  developers: Option[]
  regularPoints: number
  premiumPoints: number
}

const UNIT_TYPES = [
  { value: 'Ø³ÙƒÙ†ÙŠ', label: 'Residential' },
  { value: 'ØªØ¬Ø§Ø±ÙŠ', label: 'Commercial' },
  { value: 'Ø¥Ø¯Ø§Ø±ÙŠ', label: 'Administrative' },
  { value: 'ÙÙ†Ø¯Ù‚ÙŠ', label: 'Hospitality' },
  { value: 'Ø·Ø¨ÙŠ', label: 'Medical' },
]

const FINISHING_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'ØªØ´Ø·ÙŠØ¨ ÙƒØ§Ù…Ù„', label: 'Fully finished' },
  { value: 'Ù†ØµÙ ØªØ´Ø·ÙŠØ¨', label: 'Semi finished' },
  { value: 'Ø·ÙˆØ¨ Ø£Ø­Ù…Ø±', label: 'Core and shell' },
]

const PRICING_STRATEGIES = [
  { value: 'ÙƒØ§Ø´', label: 'Cash' },
  { value: 'Ø£Ù‚Ø³Ø§Ø·', label: 'Installments' },
  { value: 'ØªÙƒÙ…Ù„Ø© Ø£Ù‚Ø³Ø§Ø·', label: 'Installment continuation' },
]

const FEATURE_OPTIONS = [
  { value: 'NONE', label: 'Standard unit' },
  { value: 'ROOF', label: 'Roof access' },
  { value: 'GARDEN', label: 'Garden access' },
]

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        {hint ? <span className="text-xs font-semibold text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </label>
  )
}

function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#17375E] focus:ring-2 focus:ring-[#17375E]/10',
        props.className,
      )}
    />
  )
}

export function AdminAdCreateForm({
  owners,
  projects,
  developers,
  regularPoints,
  premiumPoints,
}: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? '')
  const [listingType, setListingType] = useState<'REGULAR' | 'PREMIUM'>('REGULAR')
  const [unitType, setUnitType] = useState(UNIT_TYPES[0]?.value ?? '')
  const [pricingStrategy, setPricingStrategy] = useState(PRICING_STRATEGIES[0]?.value ?? '')
  const [features, setFeatures] = useState('NONE')
  const [isFurnished, setIsFurnished] = useState(false)
  const [isRented, setIsRented] = useState(false)

  function handleSubmit() {
    setError(null)
    const form = formRef.current
    if (!form) return

    const formData = new FormData(form)
    formData.set('owner_user_id', ownerId)
    formData.set('listing_type', listingType)
    formData.set('unit_type', unitType)
    formData.set('pricing_strategy', pricingStrategy)
    formData.set('features', features)
    formData.set('is_furnished', String(isFurnished))
    formData.set('is_rented', String(isRented))

    startTransition(async () => {
      const result = await submitListingAction(formData)
      if (result?.error) {
        setError(result.error)
        return
      }

      router.push('/admin/marketplace/ads?created=1')
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        ref={formRef}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900">Ad data</h2>
          <p className="text-sm font-semibold text-slate-500">
            This form writes to the live `ads` table and uses the current upload and points pipeline.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Owner account" hint="Required">
            <NativeSelect value={ownerId} onChange={(event) => setOwnerId(event.target.value)} required>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} - {owner.email || owner.role}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Listing type" hint="Controls point spend">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setListingType('REGULAR')}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition',
                  listingType === 'REGULAR'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-500',
                )}
              >
                <span className="block text-sm font-black">Regular</span>
                <span className="mt-1 block text-xs font-semibold">{regularPoints.toLocaleString('en-US')} pts</span>
              </button>
              <button
                type="button"
                onClick={() => setListingType('PREMIUM')}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition',
                  listingType === 'PREMIUM'
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-500',
                )}
              >
                <span className="block text-sm font-black">Premium</span>
                <span className="mt-1 block text-xs font-semibold">{premiumPoints.toLocaleString('en-US')} pts</span>
              </button>
            </div>
          </Field>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Ad title" hint="Minimum 8 characters">
            <Input name="title" required minLength={8} placeholder="Example: Finished apartment in New Cairo" className="h-11" />
          </Field>

          <Field label="Area / location" hint="Required">
            <Input name="area_location" required placeholder="Example: Fifth Settlement" className="h-11" />
          </Field>

          <Field label="Project">
            <NativeSelect name="project_id" defaultValue="">
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Developer">
            <NativeSelect name="developer_id" defaultValue="">
              <option value="">No developer</option>
              {developers.map((developer) => (
                <option key={developer.id} value={developer.id}>
                  {developer.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Property type">
            <NativeSelect value={unitType} onChange={(event) => setUnitType(event.target.value)}>
              {UNIT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Feature flag">
            <NativeSelect value={features} onChange={(event) => setFeatures(event.target.value)}>
              {FEATURE_OPTIONS.map((feature) => (
                <option key={feature.value} value={feature.value}>
                  {feature.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Field label="Bedrooms">
            <Input name="rooms" type="number" min={0} placeholder="0" className="h-11" />
          </Field>
          <Field label="Bathrooms">
            <Input name="bathrooms" type="number" min={0} placeholder="0" className="h-11" />
          </Field>
          <Field label="Area sqm">
            <Input name="area_sqm" type="number" min={0} placeholder="145" className="h-11" />
          </Field>
          <Field label="Unit number">
            <Input name="unit_number" placeholder="A-304" className="h-11" />
          </Field>

          {unitType === 'ØªØ¬Ø§Ø±ÙŠ' ? (
            <>
              <Field label="Internal area sqm" hint="Required for commercial">
                <Input name="internal_area_sqm" type="number" min={0} placeholder="120" className="h-11" />
              </Field>
              <Field label="External area sqm" hint="Required for commercial">
                <Input name="external_area_sqm" type="number" min={0} placeholder="35" className="h-11" />
              </Field>
            </>
          ) : null}

          <Field label="Latitude">
            <Input name="lat" type="number" step="any" placeholder="30.0444" className="h-11" />
          </Field>
          <Field label="Longitude">
            <Input name="lng" type="number" step="any" placeholder="31.2357" className="h-11" />
          </Field>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Finishing">
            <NativeSelect name="finishing" defaultValue="">
              {FINISHING_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Detailed address">
            <Input name="detailed_address" placeholder="Tower, floor, nearby landmark" className="h-11" />
          </Field>

          <Field label="Virtual tour URL">
            <Input name="virtual_tour_url" type="url" placeholder="https://..." className="h-11" />
          </Field>

          <Field label="Video URL">
            <Input name="video_url" type="url" placeholder="https://..." className="h-11" />
          </Field>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={isFurnished}
              onChange={(event) => setIsFurnished(event.target.checked)}
              className="mt-1 size-4 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-black text-slate-800">Furnished</p>
              <p className="text-xs font-semibold text-slate-500">Marks the unit as furnished in the live ad record.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={isRented}
              onChange={(event) => setIsRented(event.target.checked)}
              className="mt-1 size-4 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-black text-slate-800">Currently rented</p>
              <p className="text-xs font-semibold text-slate-500">When enabled, add the active rental value below.</p>
            </div>
          </label>
        </section>

        {isRented ? (
          <section className="grid gap-4 md:grid-cols-3">
            <Field label="Rental value">
              <Input name="rental_value" type="number" min={0} placeholder="25000" className="h-11" />
            </Field>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <Field label="Pricing strategy">
            <NativeSelect value={pricingStrategy} onChange={(event) => setPricingStrategy(event.target.value)}>
              {PRICING_STRATEGIES.map((strategy) => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Total cash price" hint="Required">
            <Input name="total_cash_price" required type="number" min={1} placeholder="3500000" className="h-11" />
          </Field>

          {pricingStrategy !== 'ÙƒØ§Ø´' ? (
            <>
              <Field label="Down payment">
                <Input name="down_payment" type="number" min={0} placeholder="700000" className="h-11" />
              </Field>
              <Field label="Installment amount">
                <Input name="installment_amount" type="number" min={0} placeholder="45000" className="h-11" />
              </Field>
            </>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Internal admin notes for the listing content">
            <Textarea name="special_notes" rows={5} placeholder="Key selling points, delivery details, or private notes for the reviewer." />
          </Field>
          <Field label="Marketing description">
            <Textarea name="marketing_description" rows={5} placeholder="Optional ad copy that will be stored directly with the listing." />
          </Field>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UploadCloud className="size-4 text-slate-500" />
            <h3 className="text-sm font-black text-slate-900">Uploads</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Listing images" hint="At least one image, up to 12">
              <Input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required className="h-11 pt-2" />
            </Field>

            <Field label="Contract file">
              <Input name="contract_file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="h-11 pt-2" />
            </Field>

            <Field label="Payment plan file">
              <Input name="payment_plan_file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="h-11 pt-2" />
            </Field>

            <Field label="POA file">
              <Input name="poa_file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="h-11 pt-2" />
            </Field>

            <Field label="Layout file">
              <Input name="layout_file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="h-11 pt-2" />
            </Field>

            <Field label="Masterplan file">
              <Input name="masterplan_file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="h-11 pt-2" />
            </Field>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            type="submit"
            disabled={pending || !ownerId}
            className="h-11 rounded-xl bg-[#17375E] px-5 text-sm font-black text-white hover:bg-[#1D4E89]"
          >
            {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
            {pending ? 'Creating ad...' : 'Create live ad'}
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">What this admin form does</h3>
          <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-500">
            <li>Uses the same storage buckets as the public add-property flow.</li>
            <li>Creates the record in the live `ads` table.</li>
            <li>Spends points from the selected owner wallet using the current RPC.</li>
            <li>Leaves the ad in `pending` so moderation flow stays intact.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h3 className="text-sm font-black text-amber-800">Operational notes</h3>
          <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-amber-700">
            <li>If the selected owner wallet has insufficient points, creation will fail and no ad will remain.</li>
            <li>Commercial units still require internal and external area values.</li>
            <li>At least one image is required because the marketplace card depends on it.</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
