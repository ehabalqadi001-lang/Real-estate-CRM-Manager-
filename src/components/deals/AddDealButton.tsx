'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, X } from 'lucide-react'
import { addDeal, getClientsList } from '@/app/dashboard/deals/actions'

export default function AddDealButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<{id: string, name: string}[]>([])

  // جلب أسماء العملاء بمجرد فتح النافذة
  useEffect(() => {
    if (isOpen) {
      getClientsList().then(setClients)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await addDeal(formData)
      setIsOpen(false)
    } catch (error) {
      alert('حدث خطأ أثناء إضافة الصفقة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md"
      >
        <PlusIcon size={18} />
        <span className="text-sm font-medium">إضافة صفقة</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">إضافة صفقة جديدة</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصفقة (الوحدة)</label>
                <input name="title" required placeholder="مثال: شقة 150م - OIA Compound" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العميل المرتبط</label>
                <select name="client_id" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                  <option value="">-- اختر العميل --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">قيمة الصفقة (بالجنيه المصري)</label>
                <input name="value" type="number" required min="0" placeholder="مثال: 5000000" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">حالة الصفقة</label>
                <select name="status" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                  <option value="pending">قيد التفاوض</option>
                  <option value="won">مكتملة (تم البيع)</option>
                  <option value="lost">ملغاة</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-colors mt-4"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ بيانات الصفقة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}