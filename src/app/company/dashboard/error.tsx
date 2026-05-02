'use client'

import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { useEffect } from 'react'

export default function CompanyDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // تسجيل الخطأ خلف الكواليس للمراقبة
    console.error("Company Dashboard Error:", error)
  }, [error])

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center p-4 sm:p-8 text-center" dir="rtl">
      <div className="bg-red-50 p-4 sm:p-8 rounded-3xl border border-red-100 max-w-lg w-full">
        <AlertTriangle className="mx-auto text-red-500 mb-6" size={64} />
        <h2 className="text-2xl font-black text-slate-900 mb-3">عذراً، حدث خلل تقني غير متوقع</h2>
        <p className="text-slate-600 mb-8 font-medium">
          صائد الأخطاء التقط مشكلة أثناء جلب بيانات لوحة التحكم. رسالة النظام: <br/>
          <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-800 text-xs rounded-lg font-mono ltr" dir="ltr">
            {error.message}
          </span>
        </p>
        <button
          onClick={() => reset()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto transition-all"
        >
          <RefreshCcw size={18} />
          إعادة تحميل اللوحة
        </button>
      </div>
    </div>
  )
}