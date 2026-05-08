'use client'

import { useState } from 'react'
import { PlusIcon, X, Loader2, Building2, MapPin, DollarSign, Percent } from 'lucide-react'
import { addProperty } from '@/app/dashboard/properties/actions'
import { useI18n } from '@/hooks/use-i18n'

export default function AddPropertyButton() {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const response = await addProperty(formData)
      if (response && !response.success) {
        alert(t('رفضت قاعدة البيانات الإضافة بسبب: ', 'The database rejected the addition because: ') + response.error)
      } else {
        setIsOpen(false)
        window.location.reload()
      }
    } catch (error: unknown) {
      alert(t('خلل برمجي: ', 'A code error occurred: ') + (error instanceof Error ? error.message : t('خطأ غير معروف', 'Unknown error')))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#0A1128] hover:bg-[#152042] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
      >
        <PlusIcon size={18} /> {t('إضافة عقار جديد', 'Add New Property')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">{t('إضافة عقار للمخزون', 'Add Property to Inventory')}</h2>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Building2 size={16}/> {t('اسم المشروع / الوحدة', 'Project / Unit Name')}</label>
                <input type="text" name="propertyName" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500" placeholder={t('مثال: فيلا تاج سيتي', 'e.g. Taj City Villa')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><MapPin size={16}/> {t('الموقع (المنطقة)', 'Location (Area)')}</label>
                  <select name="location" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500 text-slate-700">
                    <option value="العاصمة الإدارية">{t('العاصمة الإدارية', 'New Administrative Capital')}</option>
                    <option value="الساحل الشمالي">{t('الساحل الشمالي', 'North Coast')}</option>
                    <option value="القاهرة الجديدة">{t('القاهرة الجديدة', 'New Cairo')}</option>
                    <option value="زايد / أكتوبر">{t('زايد / أكتوبر', 'Zayed / October')}</option>
                    <option value="أخرى">{t('أخرى', 'Other')}...</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Building2 size={16}/> {t('نوع العقار', 'Property Type')}</label>
                  <select name="propertyType" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500 text-slate-700">
                    <option value="سكني">{t('سكني', 'Residential')}</option>
                    <option value="تجاري">{t('تجاري', 'Commercial')}</option>
                    <option value="إداري">{t('إداري', 'Administrative')}</option>
                    <option value="طبي">{t('طبي', 'Medical')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><DollarSign size={16}/> {t('السعر المتوقع (ج.م)', 'Expected Price (EGP)')}</label>
                  <input type="number" name="price" defaultValue={0} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Percent size={16}/> {t('نسبة العمولة (%)', 'Commission Rate (%)')}</label>
                  <input type="number" step="0.1" name="commissionRate" defaultValue={0} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500" placeholder={t('مثال: 2.5', 'e.g. 2.5')} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button type="submit" disabled={isLoading} className="w-full bg-[#00C27C] hover:bg-[#009F64] text-white p-3.5 rounded-xl font-black transition-all flex justify-center items-center gap-2">
                  {isLoading
                    ? <><Loader2 size={18} className="animate-spin"/> {t('جاري الحفظ...', 'Saving...')}</>
                    : t('تأكيد وإضافة للمخزون', 'Confirm & Add to Inventory')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
