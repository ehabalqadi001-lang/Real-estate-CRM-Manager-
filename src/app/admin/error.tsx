'use client' // صائد الأخطاء يجب أن يعمل على جهة العميل (Client-side)

import { useEffect } from 'react'
import { ShieldAlert, RefreshCcw } from 'lucide-react'

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // تسجيل الخطأ في السجلات السرية (Console)
    console.error('تم التقاط خطأ بواسطة رادار القيادة:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-900 p-8" dir="rtl">
      <ShieldAlert size={64} className="text-red-500 mb-6 animate-pulse" />
      <h2 className="text-3xl font-black mb-4">⚠️ رادار القيادة التقط عطلاً فنياً!</h2>
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm mb-6 max-w-2xl w-full text-center text-red-700 font-mono text-sm overflow-auto">
        {error.message || 'حدث خطأ غير معروف في مسار الإدارة.'}
      </div>
      <button
        onClick={() => reset()} // محاولة إعادة تشغيل الصفحة
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
      >
        <RefreshCcw size={18} /> إعادة تشغيل الشاشة
      </button>
    </div>
  )
}