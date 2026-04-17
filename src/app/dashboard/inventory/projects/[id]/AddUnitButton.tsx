'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { upsertUnit } from '@/domains/inventory/units'

const UNIT_TYPES = [
  { value: 'apartment', label: 'شقة' },
  { value: 'villa', label: 'فيلا' },
  { value: 'townhouse', label: 'تاون هاوس' },
  { value: 'studio', label: 'استوديو' },
  { value: 'duplex', label: 'دوبلكس' },
  { value: 'penthouse', label: 'بنت هاوس' },
  { value: 'office', label: 'مكتب' },
  { value: 'retail', label: 'تجاري' },
]

interface Props {
  projectId: string
}

export default function AddUnitButton({ projectId }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
      if (!result.ok) { setError(result.error ?? 'حدث خطأ'); return }
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#00C27C] hover:bg-[#009F64] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-lg shadow-[#00C27C]/20"
      >
        <Plus size={15} /> إضافة وحدة
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">إضافة وحدة جديدة</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رقم الوحدة *</label>
                  <input name="unit_number" required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">نوع الوحدة</label>
                  <select name="unit_type"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30">
                    {UNIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">السعر (ج.م)</label>
                  <input name="price" type="number" min="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">المساحة (م²)</label>
                  <input name="area_sqm" type="number" min="0" step="0.1"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">عدد الغرف</label>
                  <input name="bedrooms" type="number" min="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">الدور</label>
                  <input name="floor" type="number" min="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending}
                  className="flex-1 bg-[#00C27C] hover:bg-[#009F64] disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm">
                  {pending ? 'جاري الحفظ...' : 'حفظ الوحدة'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
