import { Calculator, AlertTriangle } from 'lucide-react'
import MortgageCalculator from '@/components/calculator/MortgageCalculator'

export const dynamic = 'force-dynamic'

export default async function CalculatorPage() {
  let fetchError = null
  let exactErrorDetails = null

  try {
    // في الحاسبة نحن لا نحتاج لجلب بيانات من قاعدة البيانات حالياً
    // ولكننا نضع الـ try/catch للحفاظ على معيارية الهيكل (Standard Architecture)
    // لتسهيل ربطها مستقبلاً بإعدادات النظام (مثل نسبة الفائدة الافتراضية)
  } catch (e: any) {
    fetchError = "حدث خطأ غير متوقع أثناء تحميل محرك الحاسبة."
    exactErrorDetails = e.message || "Unknown System Error"
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* الهيدر */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="text-blue-600" /> حاسبة التمويل العقاري
          </h1>
          <p className="text-sm text-slate-500 mt-1">توليد خطط السداد وجداول الاستحقاق (Payment Plans)</p>
        </div>
      </div>

      {/* صائد الأخطاء */}
      {fetchError ? (
        <div className="bg-white rounded-3xl border-2 border-red-50 p-12 text-center shadow-sm">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertTriangle size={32} />
          </div>
          <p className="text-red-600 font-bold text-lg">{fetchError}</p>
          <code className="mt-4 block bg-slate-50 p-2 rounded text-xs font-mono text-slate-500" dir="ltr">
            {exactErrorDetails}
          </code>
        </div>
      ) : (
        <MortgageCalculator />
      )}
    </div>
  )
}