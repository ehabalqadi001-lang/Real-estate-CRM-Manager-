'use client'

import { useState } from 'react'
import { addAgentAction } from './actions'
import { AlertTriangle, UserPlus, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AddAgentPage() {
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<{message: string, details?: string} | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorState(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await addAgentAction(formData)
      if (result && !result.success) {
        setErrorState({ message: result.message, details: result.details })
        setLoading(false)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err; // السماح للتوجيه بالمرور
      setErrorState({ message: 'حدث خطأ غير متوقع أثناء إضافة الوكيل' })
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8" dir="rtl">
      
      {/* الهيدر */}
      <div className="flex items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/company/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowRight className="text-slate-500" size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">إضافة وكيل مبيعات جديد</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">سيتم إنشاء حساب فوري للموظف وربطه بمبيعات شركتك</p>
        </div>
      </div>

      {/* صائد الأخطاء */}
      {errorState && (
        <div className="bg-red-50 border border-red-200 p-4 sm:p-6 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-red-800">{errorState.message}</h3>
            {errorState.details && <p className="text-xs font-mono text-red-600 mt-1" dir="ltr">{errorState.details}</p>}
          </div>
        </div>
      )}

      {/* نموذج الإضافة */}
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">الاسم الرباعي للموظف</label>
            <input type="text" name="fullName" required className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="مثال: أحمد محمود علي" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">رقم الهاتف (واتساب)</label>
            <input type="tel" name="phone" required className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="01000000000" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">البريد الإلكتروني للوكيل</label>
            <input type="email" name="email" required className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="agent@fastinvestment.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">كلمة المرور الابتدائية</label>
            <input type="text" name="password" required minLength={6} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="تعيين باسورد للموظف" />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black text-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="animate-spin" size={24} /> جاري الإنشاء...</> : <><UserPlus size={24} /> اعتماد وإنشاء الحساب</>}
          </button>
        </div>

      </form>
    </div>
  )
}