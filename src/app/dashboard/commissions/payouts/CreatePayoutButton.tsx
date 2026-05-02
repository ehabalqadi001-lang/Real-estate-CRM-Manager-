'use client'
import { useI18n } from '@/hooks/use-i18n'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createPayout } from '@/domains/commissions/actions'
import { useRouter } from 'next/navigation'

export default function CreatePayoutButton() {
  const { dir } = useI18n()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const router = useRouter()

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  function handleCreate() {
    if (!title.trim()) return
    startTransition(async () => {
      const res = await createPayout({
        title,
        periodMonth: month,
        periodYear: year,
        commissionIds: [], // user will add from approved list
      })
      if (res.success) {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
      >
        <Plus size={15} /> دفعة جديدة
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900">إنشاء دفعة صرف جديدة</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">عنوان الدفعة</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: عمولات أبريل 2026"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">الشهر</label>
                  <select
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">السنة</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
              سيتم إنشاء دفعة فارغة. يمكنك إضافة عمولات مُعتمدة إليها من صفحة التفاصيل.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={isPending || !title.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                إنشاء الدفعة
              </button>
              <button onClick={() => setOpen(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
