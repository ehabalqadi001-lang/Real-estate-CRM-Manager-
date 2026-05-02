'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createExpense } from '@/domains/finance/actions'
import type { ExpenseCategory } from '@/lib/types/db'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { value: 'rent',      label: 'إيجار' },
  { value: 'salary',    label: 'رواتب' },
  { value: 'marketing', label: 'تسويق' },
  { value: 'utilities', label: 'خدمات' },
  { value: 'travel',    label: 'سفر' },
  { value: 'other',     label: 'أخرى' },
]

export default function AddExpenseButton() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  function handleSubmit() {
    if (!description.trim() || !amount) return
    startTransition(async () => {
      const res = await createExpense({
        description,
        amount: parseFloat(amount),
        category,
        expenseDate: date,
      })
      if (res.success) {
        setOpen(false)
        setDescription('')
        setAmount('')
        setCategory('other')
        router.refresh()
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
      >
        <Plus size={15} /> مصروف جديد
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 space-y-4" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900">إضافة مصروف جديد</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">الوصف</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="وصف المصروف..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">المبلغ (ج.م)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">التصنيف</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">التاريخ</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isPending || !description.trim() || !amount}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                إضافة المصروف
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
