import { getSalesForecast } from './actions'
import ForecastChart from './ForecastChart'
import { TrendingUp, DollarSign, Target, BarChart2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ForecastingPage() {
  const data = await getSalesForecast()

  const kpis = [
    {
      label: 'إجمالي الإيراد (12 شهر)',
      value: `${(data.totalRevenueLTM / 1_000_000).toFixed(1)}M ج.م`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'متوسط قيمة الصفقة',
      value: `${(data.avgDealValue / 1_000).toFixed(0)}K ج.م`,
      icon: BarChart2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'معدل تحويل العملاء',
      value: `${data.conversionRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'إيراد الشهر القادم (متوقع)',
      value: `${(data.forecast[0]?.revenue / 1_000_000).toFixed(1)}M ج.م`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={24} />
          التنبؤ بالمبيعات
        </h1>
        <p className="text-sm text-slate-500 mt-1">تحليل ذكي لأداء المبيعات وتوقعات الأشهر الثلاثة القادمة</p>
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

      {/* Chart */}
      <ForecastChart monthlyData={data.monthlyData} forecast={data.forecast} />

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">تحليل الذكاء الاصطناعي</span>
        </div>
        <p className="text-slate-200 leading-relaxed text-sm">{data.aiInsights}</p>
      </div>
    </div>
  )
}
