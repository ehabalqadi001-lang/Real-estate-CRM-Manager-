'use client'

import { useState } from 'react'
import { PlusIcon, X } from 'lucide-react'
import { addLead } from '@/app/dashboard/leads/actions'

export default function AddLeadButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addLead(new FormData(e.currentTarget))
      setIsOpen(false)
    } catch (error: any) {
      alert('خطأ أثناء الحفظ: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md">
        <PlusIcon size={18} />
        <span className="text-sm font-medium">إضافة عميل (Lead)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">تسجيل عميل محتمل جديد</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل</label>
                <input name="name" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input name="phone" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr" placeholder="01X XXXX XXXX" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مصدر العميل (Source)</label>
                  <select name="source" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                    <option value="Facebook">فيسبوك</option>
                    <option value="Instagram">انستجرام</option>
                    <option value="Referral">ترشيح (Referral)</option>
                    <option value="Cold Call">مكالمة باردة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مؤشر الجدية</label>
                  <select name="temperature" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                    <option value="hot">ساخن (Hot) 🔥</option>
                    <option value="warm">دافئ (Warm) ☀️</option>
                    <option value="cold">بارد (Cold) ❄️</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-colors mt-4">
                {loading ? 'جاري التسجيل...' : 'حفظ العميل في Fresh Leads'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}