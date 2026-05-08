'use client'

import { useState } from 'react'
import { PlusIcon, X } from 'lucide-react'
import { addTeamMember } from '@/app/dashboard/team/actions'
import { useI18n } from '@/hooks/use-i18n'

export default function AddMemberButton() {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addTeamMember(new FormData(e.currentTarget))
      setIsOpen(false)
      window.location.reload()
    } catch (error: unknown) {
      alert(t('خطأ أثناء حفظ بيانات الموظف: ', 'Error saving employee data: ') + (error instanceof Error ? error.message : t('خطأ غير معروف', 'Unknown error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md">
        <PlusIcon size={18} />
        <span className="text-sm font-medium">{t('إضافة عضو للفريق', 'Add Team Member')}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">{t('تسجيل موظف مبيعات جديد', 'Register New Sales Employee')}</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('اسم الموظف', 'Employee Name')}</label>
                <input name="name" required placeholder={t('مثال: مصطفى، سارة، علا...', 'e.g. John, Sara...')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('المسمى الوظيفي (Role)', 'Job Title (Role)')}</label>
                <select name="role" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="Sales Representative">{t('مسؤول مبيعات (Sales Rep)', 'Sales Representative')}</option>
                  <option value="Team Leader">{t('قائد فريق (Team Leader)', 'Team Leader')}</option>
                  <option value="Sales Manager">{t('مدير مبيعات (Sales Manager)', 'Sales Manager')}</option>
                  <option value="Admin">{t('إداري (Admin)', 'Admin')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الهاتف', 'Phone Number')}</label>
                  <input name="phone" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr" placeholder="01X XXXX XXXX" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
                  <input name="email" type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr" placeholder="email@example.com" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-colors mt-4">
                {loading ? t('جاري التسجيل...', 'Registering...') : t('إضافة للفريق', 'Add to Team')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
