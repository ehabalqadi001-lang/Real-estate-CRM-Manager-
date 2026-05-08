'use client'

import { useState, useTransition } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { generateForecastNarrativeAction } from './actions'
import { Brain, Loader2, TrendingUp, TrendingDown } from 'lucide-react'

interface MonthlyData {
  month: string
  deals: number
  revenue: number
  leads: number
  forecast?: number
}

interface LeadFunnel { stage: string; count: number }
interface RegionData  { region: string; deals: number; revenue: number }

interface Props {
  monthlyData: MonthlyData[]
  leadFunnel: LeadFunnel[]
  topRegions: RegionData[]
  totalDeals: number
  avgDealValue: number
  conversionRate: number
  topRegion: string
  trend: number
}

export function PredictiveClient({
  monthlyData, leadFunnel, topRegions,
  totalDeals, avgDealValue, conversionRate, topRegion, trend,
}: Props) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const handleNarrative = () => {
    const lastMonths = monthlyData.slice(-3)
    const avg0 = lastMonths[0]?.deals ?? 0
    const avg1 = lastMonths[lastMonths.length - 1]?.deals ?? 0
    const monthlyTrend = avg1 > avg0 ? 'تصاعدي — زيادة في الصفقات' : avg1 < avg0 ? 'تنازلي — انخفاض في الصفقات' : 'مستقر'
    start(async () => {
      const res = await generateForecastNarrativeAction({ totalDeals, avgDealValue, conversionRate, topRegion, monthlyTrend })
      if (res.narrative) setNarrative(res.narrative)
    })
  }

  const COLORS = { deals: '#0F8F83', revenue: '#C9964A', leads: '#6366f1', forecast: '#94a3b8' }

  return (
    <div className="space-y-6">
      {/* AI Forecast CTA */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--fi-emerald)]/20 bg-[var(--fi-soft)] p-4">
        <div className="flex items-center gap-3">
          <Brain className="size-5 text-[var(--fi-emerald)] shrink-0" />
          <div>
            <p className="text-sm font-black text-[var(--fi-ink)]">تحليل AI التنبؤي</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">توقعات الأشهر 3 القادمة بالذكاء الاصطناعي</p>
          </div>
        </div>
        <Button
          size="sm"
          disabled={pending}
          onClick={handleNarrative}
          className="fi-primary-button"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Brain className="size-4" />}
          توليد التوقعات
        </Button>
      </div>

      {narrative && (
        <div className="rounded-xl border border-[var(--fi-emerald)]/30 bg-[var(--fi-paper)] p-4 shadow-sm">
          <p className="mb-2 text-xs font-black text-[var(--fi-emerald)]">تحليل AI</p>
          <p className="text-sm font-semibold leading-7 text-[var(--fi-ink)]">{narrative}</p>
        </div>
      )}

      {/* Monthly Trend Chart */}
      <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-black text-[var(--fi-ink)]">اتجاه الصفقات الشهري</p>
          <span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {Math.abs(trend)}%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dealsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.deals} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.deals} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF6F5" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="deals" stroke={COLORS.deals} strokeWidth={2} fill="url(#dealsGrad)" name="صفقات" />
            <Area type="monotone" dataKey="forecast" stroke={COLORS.forecast} strokeWidth={2} strokeDasharray="5 5" fill="none" name="توقع" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Lead Funnel */}
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <p className="mb-4 font-black text-[var(--fi-ink)]">قمع المبيعات</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={leadFunnel} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF6F5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 10, fontWeight: 600 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.leads} radius={[0, 4, 4, 0]} name="العدد" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Regions */}
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <p className="mb-4 font-black text-[var(--fi-ink)]">أداء المناطق</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topRegions.slice(0, 6)} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF6F5" />
              <XAxis dataKey="region" tick={{ fontSize: 10, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="deals" fill={COLORS.deals} name="صفقات" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
