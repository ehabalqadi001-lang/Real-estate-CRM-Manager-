'use client'

import { useState, useTransition } from 'react'
import { Edit2, X, Loader2 } from 'lucide-react'
import { updateUnitDetails } from './actions'
import { useI18n } from '@/hooks/use-i18n'

interface EditUnitModalProps {
  unit: {
    id: string
    unit_name: string | null
    price: number | null
    status: string | null
  }
  projectId: string
}

export function EditUnitModal({ unit, projectId }: EditUnitModalProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleSubmit = async (formData: FormData) => {
    setError('')
    startTransition(async () => {
      try {
        await updateUnitDetails(formData)
        setIsOpen(false)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('حدث خطأ أثناء التحديث', 'An error occurred while updating'))
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
        title={t('تعديل الوحدة', 'Edit Unit')}
      >
        <Edit2 className="size-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-900">{t('تعديل الوحدة', 'Edit Unit')} {unit.unit_name || ''}</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-lg">
                <X className="size-5" />
              </button>
            </div>

            <form action={handleSubmit} className="p-5 space-y-4">
              <input type="hidden" name="unitId" value={unit.id} />
              <input type="hidden" name="projectId" value={projectId} />

              {error && <div className="p-3 text-sm font-bold text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">{t('حالة الوحدة', 'Unit Status')}</label>
                <select name="status" defaultValue={unit.status || ''} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500">
                  <option value="متاح">{t('متاح', 'Available')}</option>
                  <option value="محجوز">{t('محجوز', 'Reserved')}</option>
                  <option value="مباع">{t('مباع', 'Sold')}</option>
                  <option value="ملغي">{t('ملغي', 'Cancelled')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">{t('السعر (ج.م)', 'Price (EGP)')}</label>
                <input type="number" name="price" defaultValue={unit.price || ''} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500" required />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : t('حفظ التعديلات', 'Save Changes')}
                </button>
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 h-11 rounded-xl font-black transition-colors">
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
