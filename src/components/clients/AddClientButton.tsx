'use client'

import { useState } from 'react'
import { PlusIcon, X, User, Phone, TrendingUp, ChevronDown } from 'lucide-react'
import { addClient } from '@/app/dashboard/clients/actions'
import { COUNTRIES, INVESTMENT_TYPES, INVESTMENT_LOCATIONS } from '@/shared/config/countries'

type Step = 1 | 2 | 3

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
      <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--fi-emerald)]/10">
        <Icon className="size-4 text-[var(--fi-emerald)]" />
      </span>
      <span className="text-sm font-black text-[var(--fi-ink)]">{label}</span>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-[var(--fi-muted)]">
        {label}{required && <span className="mr-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2.5 text-sm text-[var(--fi-ink)] outline-none transition focus:border-[var(--fi-emerald)] focus:ring-2 focus:ring-[var(--fi-emerald)]/20'
const selectCls = inputCls + ' appearance-none cursor-pointer'

function PhoneField({ namePrefix, label, required }: { namePrefix: string; label: string; required?: boolean }) {
  return (
    <Field label={label} required={required}>
      <div className="flex gap-2">
        <div className="relative w-36 shrink-0">
          <select name={`${namePrefix}_country_code`} defaultValue="+20" className={selectCls + ' pr-7'}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-[var(--fi-muted)]" />
        </div>
        <input
          name={namePrefix}
          type="tel"
          required={required}
          placeholder="01xxxxxxxxx"
          className={inputCls + ' flex-1'}
          dir="ltr"
        />
      </div>
    </Field>
  )
}

function CountrySelect({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <Field label={label}>
      <div className="relative">
        <select name={name} defaultValue="" className={selectCls + ' pr-8'}>
          <option value="">{placeholder}</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-[var(--fi-muted)]" />
      </div>
    </Field>
  )
}

function CheckboxGroup({ name, options, label }: { name: string; options: readonly string[]; label: string }) {
  return (
    <Field label={label}>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--fi-line)] px-3 py-2 transition hover:border-[var(--fi-emerald)]/50 hover:bg-[var(--fi-emerald)]/5">
            <input type="checkbox" name={name} value={opt} className="accent-[var(--fi-emerald)] size-4" />
            <span className="text-xs font-semibold text-[var(--fi-ink)]">{opt}</span>
          </label>
        ))}
      </div>
    </Field>
  )
}

const STEPS: { label: string; icon: React.ElementType }[] = [
  { label: 'البيانات الشخصية', icon: User },
  { label: 'بيانات التواصل', icon: Phone },
  { label: 'بيانات الاستثمار', icon: TrendingUp },
]

export default function AddClientButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => { setIsOpen(false); setStep(1); setError(null) }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      await addClient(formData)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[var(--fi-emerald)] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[var(--fi-emerald)]/25 transition hover:opacity-90"
      >
        <PlusIcon size={16} />
        إضافة عميل
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" dir="rtl">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-base font-black text-[var(--fi-ink)]">إضافة عميل جديد</h3>
              <button onClick={close} className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex border-b border-slate-100 bg-slate-50 px-6 py-3 gap-1">
              {STEPS.map((s, i) => {
                const num = (i + 1) as Step
                const active = step === num
                const done = step > num
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setStep(num)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-black transition ${
                      active ? 'bg-[var(--fi-emerald)]/10 text-[var(--fi-emerald)]' :
                      done ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-black ${
                      active ? 'bg-[var(--fi-emerald)] text-white' :
                      done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                    }`}>{done ? '✓' : num}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[60vh] overflow-y-auto px-6 py-5">

                {/* Step 1: Personal */}
                {step === 1 && (
                  <div className="space-y-4">
                    <SectionHeader icon={User} label="البيانات الشخصية" />
                    <Field label="اسم العميل الكامل" required>
                      <input name="name" required placeholder="مثال: إيهاب محمد علي" className={inputCls} />
                    </Field>
                    <CountrySelect name="nationality" label="جنسية العميل" placeholder="اختر الجنسية..." />
                    <CountrySelect name="residence_country" label="مكان الإقامة" placeholder="اختر البلد..." />
                  </div>
                )}

                {/* Step 2: Contact */}
                {step === 2 && (
                  <div className="space-y-4">
                    <SectionHeader icon={Phone} label="بيانات التواصل" />
                    <PhoneField namePrefix="phone" label="رقم التواصل الرئيسي" required />
                    <PhoneField namePrefix="secondary_phone" label="رقم تواصل آخر (اختياري)" />
                    <Field label="البريد الإلكتروني (اختياري)">
                      <input name="email" type="email" placeholder="mail@example.com" className={inputCls} dir="ltr" />
                    </Field>
                  </div>
                )}

                {/* Step 3: Investment */}
                {step === 3 && (
                  <div className="space-y-5">
                    <SectionHeader icon={TrendingUp} label="بيانات الاستثمار" />
                    <CheckboxGroup name="investment_types" options={INVESTMENT_TYPES} label="نوع الاستثمار (يمكن اختيار أكثر من نوع)" />

                    <Field label="قيمة الاستثمار المتوقعة (جنيه مصري)">
                      <input name="investment_budget" type="number" min="0" step="1000" placeholder="مثال: 2000000" className={inputCls} dir="ltr" />
                    </Field>

                    <Field label="طريقة الدفع المفضلة">
                      <div className="flex gap-3">
                        {[{ v: 'downpayment', l: 'مقدم (كاش)' }, { v: 'installments', l: 'أقساط' }].map(({ v, l }) => (
                          <label key={v} className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-[var(--fi-line)] px-3 py-2.5 transition hover:border-[var(--fi-emerald)]/50 hover:bg-[var(--fi-emerald)]/5">
                            <input type="radio" name="payment_method" value={v} className="accent-[var(--fi-emerald)]" />
                            <span className="text-sm font-semibold text-[var(--fi-ink)]">{l}</span>
                          </label>
                        ))}
                      </div>
                    </Field>

                    <CheckboxGroup name="investment_locations" options={INVESTMENT_LOCATIONS} label="مكان الاستثمار المفضل" />
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
                <div className="flex gap-2">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep((s) => (s - 1) as Step)}
                      className="rounded-lg border border-[var(--fi-line)] px-4 py-2 text-sm font-bold text-[var(--fi-muted)] transition hover:bg-slate-100">
                      السابق
                    </button>
                  )}
                  <button type="button" onClick={close}
                    className="rounded-lg border border-[var(--fi-line)] px-4 py-2 text-sm font-bold text-[var(--fi-muted)] transition hover:bg-slate-100">
                    إلغاء
                  </button>
                </div>

                {step < 3 ? (
                  <button type="button" onClick={() => setStep((s) => (s + 1) as Step)}
                    className="rounded-xl bg-[var(--fi-emerald)] px-5 py-2 text-sm font-black text-white transition hover:opacity-90">
                    التالي
                  </button>
                ) : (
                  <button type="submit" disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-[var(--fi-emerald)] px-5 py-2 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50">
                    {loading ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        جاري الحفظ...
                      </>
                    ) : 'حفظ بيانات العميل'}
                  </button>
                )}
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
