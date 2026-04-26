import Link from 'next/link'
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Receipt, ArrowUpRight } from 'lucide-react'
import { getFinanceSummary, getRevenueTrend } from '@/domains/finance/actions'
import FinanceChart from './FinanceChart'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  rent:       { label: 'إيجار',     color: 'bg-blue-100 text-blue-700' },
  salary:     { label: 'رواتب',     color: 'bg-purple-100 text-purple-700' },
  marketing:  { label: 'تسويق',     color: 'bg-orange-100 text-orange-700' },
  utilities:  { label: 'خدمات',     color: 'bg-yellow-100 text-yellow-700' },
  travel:     { label: 'سفر',       color: 'bg-sky-100 text-sky-700' },
  other:      { label: 'أخرى',      color: 'bg-slate-100 text-[var(--fi-muted)]' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

const fmtFull = (n: number) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function FinancePage({ searchParams }: PageProps) {
  const params = await searchParams
  const now = new Date()
  const year  = parseInt(params.year  ?? String(now.getFullYear()), 10)
  const month = params.month ? parseInt(params.month, 10) : undefined

  const [summary, trend] = await Promise.all([
    getFinanceSummary(year, month),
    getRevenueTrend(12),
  ])

  return (
    <div className="p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">المركز المالي</h1>
            <p className="text-xs text-[var(--fi-muted)]">الإيرادات · المصروفات · صافي الربح</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/finance/expenses"
            className="flex items-center gap-2 border border-[var(--fi-line)] text-[var(--fi-muted)] px-3 py-2 rounded-xl text-sm font-bold hover:bg-[var(--fi-soft)] transition-colors">
            <Receipt size={14} /> المصروفات
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'إجمالي الإيرادات',
              value: `${fmt(summary.totalRevenue)} ج.م`,
              sub: `${summary.deals} صفقة`,
              icon: TrendingUp,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              trend: 'up',
            },
            {
              label: 'صافي العمولات',
              value: `${fmt(summary.totalCommissions)} ج.م`,
              sub: 'مدفوعة للوكلاء',
              icon: DollarSign,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              trend: null,
            },
            {
              label: 'إجمالي المصروفات',
              value: `${fmt(summary.totalExpenses)} ج.م`,
              sub: 'مصروفات مُعتمدة',
              icon: TrendingDown,
              color: 'text-red-600',
              bg: 'bg-red-50',
              trend: 'down',
            },
            {
              label: 'صافي الربح',
              value: `${fmt(summary.netProfit)} ج.م`,
              sub: summary.netProfit > 0 ? 'ربح صافي' : 'خسارة',
              icon: BarChart3,
              color: summary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700',
              bg: summary.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50',
              trend: null,
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[var(--fi-paper)] rounded-xl p-4 shadow-sm border border-[var(--fi-line)]">
              <div className={`${kpi.bg} ${kpi.color} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>
                <kpi.icon size={18} />
              </div>
              <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-[var(--fi-muted)] mt-0.5 font-medium">{kpi.label}</p>
              {kpi.sub && <p className="text-[10px] text-slate-300 mt-0.5">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-[var(--fi-paper)] rounded-2xl shadow-sm border border-[var(--fi-line)] p-5">
        <h2 className="font-black text-[var(--fi-ink)] mb-4">الإيراد الشهري (آخر 12 شهر)</h2>
        <FinanceChart data={trend} />
      </div>

      {/* Expenses by category */}
      {summary && Object.keys(summary.expensesByCategory).length > 0 && (
        <div className="bg-[var(--fi-paper)] rounded-2xl shadow-sm border border-[var(--fi-line)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-[var(--fi-ink)]">توزيع المصروفات</h2>
            <Link href="/dashboard/finance/expenses"
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
              عرض الكل <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {Object.entries(summary.expensesByCategory).map(([cat, amount]) => {
              const cfg = CATEGORY_LABELS[cat] ?? CATEGORY_LABELS.other
              const pct = summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${cfg.color} w-16 text-center`}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                    <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[var(--fi-ink)] w-24 text-left">
                    {fmtFull(amount)} ج.م
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { href: '/dashboard/commissions/payouts', label: 'صرف العمولات', desc: 'إنشاء واعتماد دفعات الصرف' },
          { href: '/dashboard/finance/expenses',    label: 'المصروفات',    desc: 'تتبع وموافقة المصروفات' },
          { href: '/dashboard/analytics',           label: 'التقارير',     desc: 'تحليلات وتوقعات المبيعات' },
        ].map(link => (
          <Link key={link.href} href={link.href}
            className="bg-[var(--fi-paper)] rounded-xl border border-[var(--fi-line)] p-4 hover:shadow-md hover:border-[var(--fi-line)] transition-all flex items-center justify-between group">
            <div>
              <p className="font-bold text-[var(--fi-ink)] text-sm">{link.label}</p>
              <p className="text-xs text-[var(--fi-muted)] mt-0.5">{link.desc}</p>
            </div>
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
