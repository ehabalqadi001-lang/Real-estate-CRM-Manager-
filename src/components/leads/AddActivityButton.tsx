'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { addLeadActivity } from '@/app/dashboard/leads/actions'
import { useI18n } from '@/hooks/use-i18n'

export default function AddActivityButton({ leadId }: { leadId: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState('call')

  const types = [
    { value: 'call',       label: t('مكالمة', 'Call') },
    { value: 'whatsapp',   label: t('واتساب', 'WhatsApp') },
    { value: 'meeting',    label: t('اجتماع', 'Meeting') },
    { value: 'site_visit', label: t('زيارة موقع', 'Site Visit') },
    { value: 'email',      label: t('بريد', 'Email') },
    { value: 'note',       label: t('ملاحظة', 'Note') },
  ]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('lead_id', leadId)
    startTransition(async () => {
      await addLeadActivity(fd)
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-[#00C27C] hover:bg-[#009F64] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
      >
        <Plus size={13} /> {t('إضافة نشاط', 'Add Activity')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">{t('تسجيل نشاط جديد', 'Log New Activity')}</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">{t('نوع النشاط', 'Activity Type')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {types.map(tp => (
                    <button
                      key={tp.value}
                      type="button"
                      onClick={() => setType(tp.value)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        type === tp.value
                          ? 'bg-[#00C27C] text-white border-[#00C27C]'
                          : 'border-slate-200 text-slate-600 hover:border-[#00C27C]/40'
                      }`}
                    >
                      {tp.label}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="type" value={type} />
              </div>

              {/* Outcome — only for calls/meetings */}
              {['call', 'whatsapp', 'meeting'].includes(type) && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('النتيجة', 'Outcome')}</label>
                  <select name="outcome" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30">
                    <option value="">{t('اختر النتيجة', 'Select outcome')}</option>
                    <option value="answered">{t('رد', 'Answered')}</option>
                    <option value="no_answer">{t('لم يرد', 'No Answer')}</option>
                    <option value="busy">{t('مشغول', 'Busy')}</option>
                    <option value="interested">{t('مهتم', 'Interested')}</option>
                    <option value="not_interested">{t('غير مهتم', 'Not Interested')}</option>
                  </select>
                </div>
              )}

              {/* Duration — for calls/meetings */}
              {['call', 'meeting', 'site_visit'].includes(type) && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{t('المدة (دقيقة)', 'Duration (min)')}</label>
                  <input name="duration_min" type="number" min="1" placeholder="10" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30" />
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">{t('ملاحظات', 'Notes')}</label>
                <textarea name="note" rows={3} placeholder={t('سجّل ما دار في هذا النشاط...', 'Log what happened in this activity...')} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27C]/30 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending}
                  className="flex-1 bg-[#00C27C] hover:bg-[#009F64] disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition-all">
                  {pending ? t('جاري الحفظ...', 'Saving...') : t('حفظ النشاط', 'Save Activity')}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50">
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
