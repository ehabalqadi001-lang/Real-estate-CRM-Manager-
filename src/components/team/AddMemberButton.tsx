'use client'

import { useState } from 'react'
import { PlusIcon, X } from 'lucide-react'
import { addTeamMember } from '@/app/dashboard/team/actions'

export default function AddMemberButton() {
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
      alert('خطأ أثناء حفظ بيانات الموظف: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md">
        <PlusIcon size={18} />
        <span className="text-sm font-medium">إضافة عضو للفريق</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">تسجيل موظف مبيعات جديد</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف</label>
                <input name="name" required placeholder="مثال: مصطفى، سارة، علا..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي (Role)</label>
                <select name="role" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="Sales Representative">مسؤول مبيعات (Sales Rep)</option>
                  <option value="Team Leader">قائد فريق (Team Leader)</option>
                  <option value="Sales Manager">مدير مبيعات (Sales Manager)</option>
                  <option value="Admin">إداري (Admin)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input name="phone" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr" placeholder="01X XXXX XXXX" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input name="email" type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr" placeholder="email@example.com" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-colors mt-4">
                {loading ? 'جاري التسجيل...' : 'إضافة للفريق'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}