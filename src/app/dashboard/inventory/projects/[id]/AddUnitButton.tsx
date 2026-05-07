'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { upsertUnit } from '@/app/dashboard/inventory/actions'
import { useI18n } from '@/hooks/use-i18n'

interface Props {
  projectId: string
}

export default function AddUnitButton({ projectId }: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const UNIT_TYPES = [
    { value: 'apartment', label: t('شقة', 'Apartment') },
    { value: 'villa',     label: t('فيلا', 'Villa') },
    { value: 'townhouse', label: t('تاون هاوس', 'Townhouse') },
    { value: 'studio',    label: t('استوديو', 'Studio') },
    { value: 'duplex',    label: t('دوبلكس', 'Duplex') },
    { value: 'penthouse', label: t('بنت هاوس', 'Penthouse') },
    { value: 'office',    label: t('مكتب', 'Office') },
    { value: 'retail',    label: t('تجاري', 'Retail') },
  ]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await upsertUnit({
        project_id: projectId,
        unit_number: fd.get('unit_number') as string,
        unit_type:   fd.get('unit_type') as string,
        status:      'available',
        price:       fd.get('price') ? Number(fd.get('price')) : undefined,
        area_sqm:    fd.get('area_sqm') ? Number(fd.get('area_sqm')) : undefined,
        bedrooms:    fd.get('bedrooms') ? Number(fd.get('bedrooms')) : undefined,
        floor:       fd.get('floor') ? Number(fd.get('floor')) : undefined,
      })
      if (!result.ok) { setError(result.error ?? t('حدث خطأ', 'An error occurred')); return }
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#00C27C] hover:bg-[#009F64] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-lg shadow-[#00C27C]/20"
      >
        <Plus size={15} /> {t('إضافة وحدة', 'Add Unit')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">{t('إضافة وحدة جديدة', 'Add New Unit')}</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('رقم الوحدة *', 'Unit Number *')}</label>
                  <input name="unit_number" required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('نوع الوحدة', 'Unit Type')}</label>
                  <select name="unit_type"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30">
                    {UNIT_TYPES.map(ut => <option key={ut.value} value={ut.value}>{ut.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('السعر (ج.م)', 'Price (EGP)')}</label>
                  <input name="price" type="number" min="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('المساحة (م²)', 'Area (m²)')}</label>
                  <input name="area_sqm" type="number" min="0" step="0.1"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('عدد الغرف', 'Bedrooms')}</label>
                  <input name="bedrooms" type="number" min="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('الدور', 'Floor')}</label>
                  <input name="floor" type="number" min="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending}
                  className="flex-1 bg-[#00C27C] hover:bg-[#009F64] disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm">
                  {pending ? t('جاري الحفظ...', 'Saving...') : t('حفظ الوحدة', 'Save Unit')}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600">
                  {t('إلغاء', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
