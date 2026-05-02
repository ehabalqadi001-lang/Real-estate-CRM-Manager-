'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { addProject } from './actions'
import { useI18n } from '@/hooks/use-i18n'

export default function AddProjectButton() {
  const { dir } = useI18n()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await addProject(fd)
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#00C27C] hover:bg-[#009F64] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-lg shadow-[#00C27C]/20"
      >
        <Plus size={15} /> إضافة مشروع
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">مشروع جديد</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">اسم المشروع</label>
                <input name="name" required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">الموقع / المنطقة</label>
                <input name="location" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">تاريخ الإطلاق</label>
                  <input name="launch_date" type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">تاريخ التسليم</label>
                  <input name="delivery_date" type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending}
                  className="flex-1 bg-[#00C27C] hover:bg-[#009F64] disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm">
                  {pending ? 'جاري الحفظ...' : 'حفظ المشروع'}
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
