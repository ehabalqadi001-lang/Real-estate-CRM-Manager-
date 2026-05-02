import { Calculator } from 'lucide-react'
import CalculatorTabs from './CalculatorTabs'
import { getI18n } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export default async function CalculatorPage() {
  const { t } = await getI18n()
  return (
    <div className="space-y-6 p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="text-blue-600" size={24} />
          {t('الحاسبات المالية العقارية', 'Real Estate Financial Calculators')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('حاسبة القسط الشهري، خطة السداد، وتحليل العائد على الاستثمار', 'Monthly installment calculator, payment plan, and ROI analysis')}</p>
      </div>
      <CalculatorTabs />
    </div>
  )
}
