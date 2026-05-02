import Link from 'next/link'
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Receipt, ArrowUpRight } from 'lucide-react'
import { getFinanceSummary, getRevenueTrend } from '@/domains/finance/actions'
import FinanceChart from './FinanceChart'
import { getI18n } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function FinancePage({ searchParams }: PageProps) {
  const { t, numLocale } = await getI18n()
  const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
    rent:       { label: t('إيجار', 'Rent'),          color: 'bg-blue-100 text-blue-700' },
    salary:     { label: t('رواتب', 'Salaries'),       color: 'bg-purple-100 text-purple-700' },
    marketing:  { label: t('تسويق', 'Marketing'),      color: 'bg-orange-100 text-orange-700' },
    utilities:  { label: t('خدمات', 'Utilities'),      color: 'bg-yellow-100 text-yellow-700' },
    travel:     { label: t('سفر', 'Travel'),           color: 'bg-sky-100 text-sky-700' },
    other:      { label: t('أخرى', 'Other'),           color: 'bg-slate-100 text-[var(--fi-muted)]' },
  }
  const fmt = (n: number) =>
    new Intl.NumberFormat(numLocale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  const fmtFull = (n: number) =>
    new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(n)
  const params = await searchParams
  const now = new Date()
  const year  = parseInt(params.year  ?? String(now.getFullYear()), 10)
  const month = params.month ? parseInt(params.month, 10) : undefined

  const [summary, trend] = await Promise.all([
    getFinanceSummary(year, month),
    getRevenueTrend(12),
  ])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">{t('المركز المالي', 'Financial Center')}</h1>
            <p className="text-xs text-[var(--fi-muted)]">{t('الإيرادات · المصروفات · صافي الربح', 'Revenue · Expenses · Net Profit')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/finance/expenses"
            className="flex items-center gap-2 border border-[var(--fi-line)] text-[var(--fi-muted)] px-3 py-2 rounded-xl text-sm font-bold hover:bg-[var(--fi-soft)] transition-colors">
            <Receipt size={14} /> {t('المصروفات', 'Expenses')}
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: t('إجمالي الإيرادات', 'Total Revenue'),
              value: `${fmt(summary.totalRevenue)} ${t('ج.م', 'EGP')}`,
              sub: `${summary.deals} ${t('صفقة', 'deals')}`,
              icon: TrendingUp,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              trend: 'up',
            },
            {
              label: t('صافي العمولات', 'Net Commissions'),
              value: `${fmt(summary.totalCommissions)} ${t('ج.م', 'EGP')}`,
              sub: t('مدفوعة للوكلاء', 'Paid to agents'),
              icon: DollarSign,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              trend: null,
            },
            {
              label: t('إجمالي المصروفات', 'Total Expenses'),
              value: `${fmt(summary.totalExpenses)} ${t('ج.م', 'EGP')}`,
              sub: t('مصروفات مُعتمدة', 'Approved expenses'),
              icon: TrendingDown,
              color: 'text-red-600',
              bg: 'bg-red-50',
              trend: 'down',
            },
            {
              label: t('صافي الربح', 'Net Profit'),
              value: `${fmt(summary.netProfit)} ${t('ج.م', 'EGP')}`,
              sub: summary.netProfit > 0 ? t('ربح صافي', 'Net profit') : t('خسارة', 'Loss'),
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
        <h2 className="font-black text-[var(--fi-ink)] mb-4">{t('الإيراد الشهري (آخر 12 شهر)', 'Monthly Revenue (Last 12 months)')}</h2>
        <FinanceChart data={trend} />
      </div>

      {/* Expenses by category */}
      {summary && Object.keys(summary.expensesByCategory).length > 0 && (
        <div className="bg-[var(--fi-paper)] rounded-2xl shadow-sm border border-[var(--fi-line)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-[var(--fi-ink)]">{t('توزيع المصروفات', 'Expense Breakdown')}</h2>
            <Link href="/dashboard/finance/expenses"
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
              {t('عرض الكل', 'View all')} <ArrowUpRight size={12} />
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
                    {fmtFull(amount)} {t('ج.م', 'EGP')}
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
          { href: '/dashboard/commissions/payouts', label: t('صرف العمولات', 'Commission Payouts'), desc: t('إنشاء واعتماد دفعات الصرف', 'Create and approve payout batches') },
          { href: '/dashboard/finance/expenses',    label: t('المصروفات', 'Expenses'),             desc: t('تتبع وموافقة المصروفات', 'Track and approve expenses') },
          { href: '/dashboard/analytics',           label: t('التقارير', 'Reports'),               desc: t('تحليلات وتوقعات المبيعات', 'Sales analytics and forecasts') },
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
