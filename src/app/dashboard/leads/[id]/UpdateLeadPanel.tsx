'use client'

import { useState, useTransition } from 'react'
import { Edit3, CheckCircle, ChevronDown } from 'lucide-react'
import { updateLeadStatus } from './update-actions'

const STATUSES = [
  'Fresh Leads', 'Contacted', 'Interested', 'Site Visit',
  'Negotiation', 'Contracted', 'Not Interested', 'Follow Up',
]

const STATUS_AR: Record<string, string> = {
  'Fresh Leads': 'جديد', 'Contacted': 'تم التواصل', 'Interested': 'مهتم',
  'Site Visit': 'زيارة موقع', 'Negotiation': 'تفاوض', 'Contracted': 'تعاقد',
  'Not Interested': 'غير مهتم', 'Follow Up': 'متابعة',
}

interface Props {
  leadId: string
  currentStatus: string | null
  currentTemp: string | null
  currentValue: number | null
}

export default function UpdateLeadPanel({ leadId, currentStatus, currentTemp, currentValue }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateLeadStatus(leadId, fd)
      setSaved(true)
      setTimeout(() => { setSaved(false); setOpen(false) }, 1200)
    })
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <Edit3 size={13} /> تحديث بيانات العميل
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">الحالة</label>
              <select name="status" defaultValue={currentStatus ?? 'Fresh Leads'}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/30">
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_AR[s] ?? s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">الحرارة</label>
              <select name="temperature" defaultValue={currentTemp ?? 'warm'}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/30">
                <option value="hot">🔥 ساخن</option>
                <option value="warm">📈 دافئ</option>
                <option value="cold">❄️ بارد</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">القيمة المتوقعة (ج.م)</label>
            <input name="expected_value" type="number" min="0" defaultValue={currentValue ?? ''}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">ملاحظات</label>
            <textarea name="notes" rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/30 resize-none" />
          </div>
          <button type="submit" disabled={pending}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-700 text-white disabled:opacity-60'}`}>
            {saved ? <><CheckCircle size={12} /> تم الحفظ</> : pending ? 'جاري الحفظ...' : 'حفظ التحديثات'}
          </button>
        </form>
      )}
    </div>
  )
}
