import { Calculator } from 'lucide-react'
import CalculatorTabs from './CalculatorTabs'

export const dynamic = 'force-dynamic'

export default function CalculatorPage() {
  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="text-blue-600" size={24} />
          الحاسبات المالية العقارية
        </h1>
        <p className="text-sm text-slate-500 mt-1">حاسبة القسط الشهري، خطة السداد، وتحليل العائد على الاستثمار</p>
      </div>
      <CalculatorTabs />
    </div>
  )
}
