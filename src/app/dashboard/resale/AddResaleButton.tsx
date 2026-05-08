'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { addResaleListing } from './actions'
import { useI18n } from '@/hooks/use-i18n'

export default function AddResaleButton() {
  const { t, dir } = useI18n()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await addResaleListing(fd)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 my-4" dir={dir}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">{t('وحدة إعادة بيع جديدة', 'New Resale Unit')}</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('اسم المشروع *', 'Project Name *')}</label>
                  <input name="project_name" required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('نوع الوحدة', 'Unit Type')}</label>
                  <select name="unit_type" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30">
                    <option value="شقة">{t('شقة', 'Apartment')}</option>
                    <option value="فيلا">{t('فيلا', 'Villa')}</option>
                    <option value="دوبلكس">{t('دوبلكس', 'Duplex')}</option>
                    <option value="روف">{t('روف', 'Roof')}</option>
                    <option value="توين هاوس">{t('توين هاوس', 'Twin House')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('التشطيب', 'Finishing')}</label>
                  <select name="finishing" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30">
                    <option value="">{t('اختر', 'Select')}</option>
                    <option value="مشطب">{t('مشطب', 'Finished')}</option>
                    <option value="نص تشطيب">{t('نص تشطيب', 'Semi-finished')}</option>
                    <option value="بدون تشطيب">{t('بدون تشطيب', 'Unfinished')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('الدور', 'Floor')}</label>
                  <input name="floor" type="number" min="0" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('المساحة (م²)', 'Area (m²)')}</label>
                  <input name="area_sqm" type="number" min="1" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('غرف النوم', 'Bedrooms')}</label>
                  <input name="bedrooms" type="number" min="0" max="10" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('سعر الطلب (ج.م) *', 'Asking Price (EGP) *')}</label>
                  <input name="asking_price" type="number" min="0" required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('السعر الأصلي (ج.م)', 'Original Price (EGP)')}</label>
                  <input name="original_price" type="number" min="0" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('اسم البائع', 'Seller Name')}</label>
                  <input name="seller_name" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('هاتف البائع', 'Seller Phone')}</label>
                  <input name="seller_phone" type="tel" dir="ltr" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">{t('ملاحظات', 'Notes')}</label>
                <textarea name="seller_notes" rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending}
                  className="flex-1 bg-[#00C27C] hover:bg-[#009F64] disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition-all">
                  {pending ? t('جاري الحفظ...', 'Saving...') : t('إضافة الوحدة', 'Add Unit')}
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
