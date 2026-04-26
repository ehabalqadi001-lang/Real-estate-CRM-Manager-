'use client'

import { useRef, useState } from 'react'
import { User, Camera, CreditCard, Building2, Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase/browser'
import { updateBrokerProfile } from './actions'

interface BrokerProfileData {
  national_id?: string | null
  tax_card_number?: string | null
  bank_name?: string | null
  bank_account_name?: string | null
  bank_account_number?: string | null
  bank_iban?: string | null
  photo_url?: string | null
  national_id_url?: string | null
  tax_card_url?: string | null
}

export function BrokerProfileForm({
  uid,
  brokerProfile,
}: {
  uid: string
  brokerProfile: BrokerProfileData | null
}) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [uploadedFlags, setUploadedFlags] = useState({
    photo: !!brokerProfile?.photo_url,
    nationalIdFile: !!brokerProfile?.national_id_url,
    taxCardFile: !!brokerProfile?.tax_card_url,
  })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const photoPathRef = useRef<HTMLInputElement>(null)
  const nationalIdPathRef = useRef<HTMLInputElement>(null)
  const taxCardPathRef = useRef<HTMLInputElement>(null)

  const supabase = createSupabaseBrowser()

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    storagePath: string,
    hiddenRef: React.RefObject<HTMLInputElement | null>,
    key: keyof typeof uploadedFlags,
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(prev => ({ ...prev, [key]: true }))
    try {
      const ext = file.name.split('.').pop() ?? 'bin'
      const fullPath = `${storagePath}.${ext}`
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fullPath, file, { upsert: true })
      if (error) throw error
      // Store the full public URL, not just the path
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(data.path)
      if (hiddenRef.current) hiddenRef.current.value = publicUrl
      setUploadedFlags(prev => ({ ...prev, [key]: true }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل رفع الملف'
      setUploadError(`فشل رفع الملف: ${msg}`)
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }))
    }
  }

  const isUploading = Object.values(uploading).some(Boolean)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(false)
    setSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await updateBrokerProfile(formData)
      if (result && !result.ok) {
        setSaveError(result.error)
      } else {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      setSaveError('حدث خطأ غير متوقع. يرجى المحاولة مجدداً.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-5"
    >
      {/* Hidden path fields — filled by client-side uploads */}
      <input type="hidden" name="photoPath" ref={photoPathRef} />
      <input type="hidden" name="nationalIdPath" ref={nationalIdPathRef} />
      <input type="hidden" name="taxCardPath" ref={taxCardPathRef} />

      <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <User className="w-4 h-4 text-emerald-500" />
        تحديث البيانات الشخصية
      </h2>

      {/* Photo */}
      <Section title="الصورة الشخصية" icon={Camera}>
        <UploadField
          fieldKey="photo"
          label="رفع صورة شخصية"
          hint="JPG أو PNG — الحد الأقصى 5 ميجا"
          accept="image/*"
          uploaded={uploadedFlags.photo}
          uploading={!!uploading.photo}
          onChange={e => handleFileChange(e, `broker-photos/${uid}/profile`, photoPathRef, 'photo')}
        />
      </Section>

      {/* Identity */}
      <Section title="بيانات الهوية" icon={CreditCard}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="رقم البطاقة الوطنية">
            <input
              name="nationalId"
              defaultValue={brokerProfile?.national_id ?? ''}
              placeholder="14 رقم"
              className="pf-input"
              dir="ltr"
            />
          </FormField>
          <FormField label="رقم الكارت الضريبي">
            <input
              name="taxCardNumber"
              defaultValue={brokerProfile?.tax_card_number ?? ''}
              className="pf-input"
              dir="ltr"
            />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 mt-3">
          <UploadField
            fieldKey="nationalIdFile"
            label="رفع صورة البطاقة"
            hint="JPG / PDF"
            accept="image/*,.pdf"
            uploaded={uploadedFlags.nationalIdFile}
            uploading={!!uploading.nationalIdFile}
            onChange={e => handleFileChange(e, `broker-docs/${uid}/national_id`, nationalIdPathRef, 'nationalIdFile')}
          />
          <UploadField
            fieldKey="taxCardFile"
            label="رفع الكارت الضريبي"
            hint="JPG / PDF"
            accept="image/*,.pdf"
            uploaded={uploadedFlags.taxCardFile}
            uploading={!!uploading.taxCardFile}
            onChange={e => handleFileChange(e, `broker-docs/${uid}/tax_card`, taxCardPathRef, 'taxCardFile')}
          />
        </div>
      </Section>

      {/* Bank */}
      <Section title="بيانات الحساب البنكي" icon={Building2}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="اسم البنك">
            <input name="bankName" defaultValue={brokerProfile?.bank_name ?? ''} className="pf-input" />
          </FormField>
          <FormField label="اسم صاحب الحساب">
            <input name="bankAccountName" defaultValue={brokerProfile?.bank_account_name ?? ''} className="pf-input" />
          </FormField>
          <FormField label="رقم الحساب">
            <input name="bankAccountNumber" defaultValue={brokerProfile?.bank_account_number ?? ''} className="pf-input" dir="ltr" />
          </FormField>
          <FormField label="رقم الـ IBAN">
            <input name="bankIban" defaultValue={brokerProfile?.bank_iban ?? ''} placeholder="EG..." className="pf-input" dir="ltr" />
          </FormField>
        </div>
      </Section>

      {uploadError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {uploadError}
        </div>
      )}

      {saveError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle className="w-4 h-4 shrink-0" />
          تم حفظ البيانات بنجاح
        </div>
      )}

      <button
        type="submit"
        disabled={isUploading || submitting}
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري الحفظ...
          </>
        ) : isUploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري رفع الملف...
          </>
        ) : 'حفظ التغييرات'}
      </button>

      <style>{`
        .pf-input {
          display: block; width: 100%; height: 40px;
          border-radius: 8px; border: 1px solid rgb(229 231 235);
          background: rgb(249 250 251); padding: 0 12px;
          font-size: 14px; font-weight: 600; outline: none;
        }
        .pf-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgb(16 185 129 / 14%); }
        @media (prefers-color-scheme: dark) {
          .pf-input { background: rgb(17 24 39); border-color: rgb(55 65 81); color: white; }
        }
      `}</style>
    </form>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </p>
      {children}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  )
}

function UploadField({
  label, hint, accept, uploaded, uploading, onChange,
}: {
  fieldKey: string
  label: string
  hint: string
  accept: string
  uploaded: boolean
  uploading: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className={`flex items-center gap-3 rounded-xl border-2 border-dashed p-3 cursor-pointer transition-colors ${
      uploaded
        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 hover:border-emerald-300'
    }`}>
      {uploading ? (
        <Loader2 className="w-4 h-4 shrink-0 text-emerald-500 animate-spin" />
      ) : uploaded ? (
        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
      ) : (
        <Upload className="w-4 h-4 shrink-0 text-gray-400" />
      )}
      <div className="min-w-0">
        <p className={`text-xs font-black ${uploaded ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {uploading ? 'جاري الرفع...' : uploaded ? `✓ مرفوع — ${label}` : label}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
      </div>
      <input type="file" accept={accept} className="sr-only" onChange={onChange} />
    </label>
  )
}
