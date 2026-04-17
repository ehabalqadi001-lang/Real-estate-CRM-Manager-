'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { addLeadActivity } from '@/app/dashboard/leads/actions'

export default function AddActivityButton({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState('call')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('lead_id', leadId)
    startTransition(async () => {
      await addLeadActivity(fd)
      setOpen(false)
    })
  }

  const types = [
    { value: 'call', label: 'مكالمة' },
    { value: 'whatsapp', label: 'واتساب' },
    { value: 'meeting', label: 'اجتماع' },
    { value: 'site_visit', label: 'زيارة موقع' },
    { value: 'email', label: 'بريد' },
    { value: 'note', label: 'ملاحظة' },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-[#00C27C] hover:bg-[#009F64] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
      >
        <Plus size={13} /> إضافة نشاط
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">تسجيل نشاط جديد</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">نوع النشاط</label>
                <div className="grid grid-cols-3 gap-2">
                  {types.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        type === t.value
                          ? 'bg-[#00C27C] text-white border-[#00C27C]'
                          : 'border-slate-200 text-slate-600 hover:border-[#00C27C]/40'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="type" value={type} />
              </div>

              {/* Outcome — only for calls/meetings */}
              {['call', 'whatsapp', 'meeting'].includes(type) && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">النتيجة</label>
                  <select name="outcome" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30">
                    <option value="">اختر النتيجة</option>
                    <option value="answered">رد</option>
                    <option value="no_answer">لم يرد</option>
                    <option value="busy">مشغول</option>
                    <option value="interested">مهتم</option>
                    <option value="not_interested">غير مهتم</option>
                  </select>
                </div>
              )}

              {/* Duration — for calls/meetings */}
              {['call', 'meeting', 'site_visit'].includes(type) && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">المدة (دقيقة)</label>
                  <input name="duration_min" type="number" min="1" placeholder="10" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">ملاحظات</label>
                <textarea name="note" rows={3} placeholder="سجّل ما دار في هذا النشاط..." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending}
                  className="flex-1 bg-[#00C27C] hover:bg-[#009F64] disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition-all">
                  {pending ? 'جاري الحفظ...' : 'حفظ النشاط'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50">
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
