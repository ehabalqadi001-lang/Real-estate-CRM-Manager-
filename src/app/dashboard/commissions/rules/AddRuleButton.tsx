'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { addRule } from './actions'
import { useI18n } from '@/hooks/use-i18n'

export default function AddRuleButton() {
  const { dir } = useI18n()
  const [open, setOpen] = useState(false)
  const [usePercentage, setUsePercentage] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('use_percentage', usePercentage.toString())
      await addRule(fd)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#00C27C] hover:bg-[#009F64] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-lg shadow-[#00C27C]/20"
      >
        <Plus size={15} /> إضافة قاعدة
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">قاعدة عمولة جديدة</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">اسم القاعدة</label>
                <input name="name" required placeholder="مثال: عمولة وكيل 2.5%" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">نوع المستفيد</label>
                <select name="commission_type" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30">
                  <option value="agent">وكيل</option>
                  <option value="manager">مدير</option>
                  <option value="company">شركة</option>
                  <option value="developer">مطور</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">اسم المشروع (اختياري — اتركه فارغاً لتطبيقه على الكل)</label>
                <input name="project_name" placeholder="اسم المشروع" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setUsePercentage(true)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${usePercentage ? 'bg-[#00C27C] text-white border-[#00C27C]' : 'border-slate-200 text-slate-500'}`}>
                  نسبة مئوية %
                </button>
                <button type="button" onClick={() => setUsePercentage(false)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${!usePercentage ? 'bg-[#00C27C] text-white border-[#00C27C]' : 'border-slate-200 text-slate-500'}`}>
                  مبلغ ثابت ج.م
                </button>
              </div>

              {usePercentage ? (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">النسبة المئوية</label>
                  <input name="percentage" type="number" step="0.01" min="0" max="100" required placeholder="2.50" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">المبلغ الثابت (ج.م)</label>
                  <input name="flat_amount" type="number" min="0" required placeholder="50000" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#00C27C] hover:bg-[#009F64] disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition-all">
                  {loading ? 'جاري الحفظ...' : 'حفظ القاعدة'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">
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
