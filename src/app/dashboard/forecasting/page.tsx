import { getI18n } from '@/lib/i18n'
import Link from 'next/link'
import { getSalesForecast } from './actions'
import ForecastChart from './ForecastChart'
import { TrendingUp, DollarSign, Target, BarChart2, PlusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ForecastingPage() {
  const { t } = await getI18n()
  const data = await getSalesForecast()

  const kpis = [
    {
      label: t('إجمالي الإيراد (12 شهر)', 'Total Revenue (12m)'),
      value: `${(data.totalRevenueLTM / 1_000_000).toFixed(1)}M`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: t('متوسط قيمة الصفقة', 'Avg Deal Value'),
      value: `${(data.avgDealValue / 1_000).toFixed(0)}K`,
      icon: BarChart2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t('معدل تحويل العملاء', 'Lead Conversion Rate'),
      value: `${data.conversionRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: t('إيراد الشهر القادم (متوقع)', 'Next Month Revenue (forecast)'),
      value: `${(data.forecast[0]?.revenue / 1_000_000).toFixed(1)}M`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={24} />
          {t('التنبؤ بالمبيعات', 'Sales Forecasting')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('تحليل ذكي لأداء المبيعات وتوقعات الأشهر الثلاثة القادمة', 'AI-powered sales analytics and 3-month projections')}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`${kpi.bg} ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <kpi.icon size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Chart or empty state */}
      {data.totalRevenueLTM === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 shadow-sm">
          <BarChart2 size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-black text-slate-800 mb-2">{t('لا توجد بيانات مبيعات بعد', 'No sales data yet')}</h3>
          <p className="text-slate-500 text-sm mb-6">{t('ابدأ بتسجيل الصفقات لتظهر هنا توقعات المبيعات والتحليلات.', 'Start recording deals to see forecasts and analytics here.')}</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard/deals"
              className="flex items-center gap-2 bg-[#00C27C] hover:bg-[#009F64] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-[#00C27C]/20">
              <PlusCircle size={16} /> {t('تسجيل صفقة', 'Add Deal')}
            </Link>
            <Link href="/dashboard/leads"
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
              {t('إدارة العملاء', 'Manage Leads')}
            </Link>
          </div>
        </div>
      ) : (
        <ForecastChart monthlyData={data.monthlyData} forecast={data.forecast} />
      )}

      {/* AI Insights — only when there is data */}
      {data.totalRevenueLTM > 0 && (
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">{t('تحليل الذكاء الاصطناعي', 'AI Insights')}</span>
          </div>
          <p className="text-slate-200 leading-relaxed text-sm">{data.aiInsights}</p>
        </div>
      )}
    </div>
  )
}
