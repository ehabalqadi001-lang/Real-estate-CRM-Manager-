'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { addResaleListing } from './actions'

export default function AddResaleButton() {
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
        <Plus size={15} /> إضافة وحدة
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-4" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">وحدة إعادة بيع جديدة</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">اسم المشروع *</label>
                  <input name="project_name" required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">نوع الوحدة</label>
                  <select name="unit_type" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30">
                    <option value="شقة">شقة</option>
                    <option value="فيلا">فيلا</option>
                    <option value="دوبلكس">دوبلكس</option>
                    <option value="روف">روف</option>
                    <option value="توين هاوس">توين هاوس</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">التشطيب</label>
                  <select name="finishing" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30">
                    <option value="">اختر</option>
                    <option value="مشطب">مشطب</option>
                    <option value="نص تشطيب">نص تشطيب</option>
                    <option value="بدون تشطيب">بدون تشطيب</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">الدور</label>
                  <input name="floor" type="number" min="0" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">المساحة (م²)</label>
                  <input name="area_sqm" type="number" min="1" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">غرف النوم</label>
                  <input name="bedrooms" type="number" min="0" max="10" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">سعر الطلب (ج.م) *</label>
                  <input name="asking_price" type="number" min="0" required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">السعر الأصلي (ج.م)</label>
                  <input name="original_price" type="number" min="0" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">اسم البائع</label>
                  <input name="seller_name" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">هاتف البائع</label>
                  <input name="seller_phone" type="tel" dir="ltr" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">ملاحظات</label>
                <textarea name="seller_notes" rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending}
                  className="flex-1 bg-[#00C27C] hover:bg-[#009F64] disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition-all">
                  {pending ? 'جاري الحفظ...' : 'إضافة الوحدة'}
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
