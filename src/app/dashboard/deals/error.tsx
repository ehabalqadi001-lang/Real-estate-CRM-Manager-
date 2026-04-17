'use client'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { useEffect } from 'react'
export default function DealsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Deals Error:', error) }, [error])
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center" dir="rtl">
      <div className="bg-red-50 p-8 rounded-3xl border border-red-100 max-w-lg w-full shadow-lg">
        <AlertTriangle className="mx-auto text-red-500 mb-6" size={64} />
        <h2 className="text-2xl font-black text-slate-900 mb-3">خطأ في صفحة الصفقات</h2>
        <p className="text-slate-600 mb-8 font-medium"><span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-800 text-xs rounded-lg font-mono" dir="ltr">{error.message}</span></p>
        <button onClick={reset} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto transition-all">
          <RefreshCcw size={18} /> إعادة المحاولة
        </button>
      </div>
    </div>
  )
}
