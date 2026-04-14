'use client'

import { useState } from 'react'
import { PlusIcon, X, Loader2, User, Phone, Mail, Building2, DollarSign } from 'lucide-react'
import { addLead } from '@/app/dashboard/leads/actions'

export default function AddLeadButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await addLead(formData)
      setIsOpen(false)
      window.location.reload() // تحديث الصفحة لظهور العميل فوراً
    } catch (error) {
      console.error("Error adding lead:", error)
      alert("حدث خطأ أثناء الإضافة. يرجى المحاولة مرة أخرى.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* الزر الرئيسي */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[#0A1128] hover:bg-[#152042] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
      >
        <PlusIcon size={18} /> إضافة عميل
      </button>

      {/* النافذة المنبثقة (Modal) */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">إضافة عميل محتمل</h2>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><User size={16}/> اسم العميل</label>
                <input type="text" name="clientName" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="مثال: أحمد محمود" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Phone size={16}/> رقم الهاتف</label>
                  <input type="tel" name="phone" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500" placeholder="010..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Mail size={16}/> الإيميل</label>
                  <input type="email" name="email" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500" placeholder="email@..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Building2 size={16}/> نوع العقار</label>
                  <select name="propertyType" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500 text-slate-700">
                    <option value="سكني">سكني</option>
                    <option value="تجاري">تجاري</option>
                    <option value="إداري">إداري</option>
                    <option value="طبي">طبي</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><DollarSign size={16}/> القيمة المتوقعة</label>
                  <input type="number" name="expectedValue" defaultValue={0} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-black transition-all flex justify-center items-center gap-2">
                  {isLoading ? <><Loader2 size={18} className="animate-spin"/> جاري الحفظ...</> : 'تأكيد وإضافة العميل'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}