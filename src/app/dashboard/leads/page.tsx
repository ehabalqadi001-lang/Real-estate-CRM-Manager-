import Link from 'next/link'
import { Users, Plus, Phone, Calendar, TrendingUp, Target, Flame, ArrowUpRight } from 'lucide-react'
import LeadFilters from '@/components/leads/LeadFilters'
import BulkImportButton from '@/components/leads/BulkImportButton'
import RescoreButton from './RescoreButton'
import { getLeadList } from '@/domains/leads/queries'
import { scoreColor, scoreLabel } from './score-utils'
import { getI18n } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

interface PageProps {
  searchParams: Promise<{ query?: string; status?: string; page?: string }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const { t, dir, numLocale } = await getI18n()

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    'Fresh Leads':    { label: t('جديد', 'Fresh'),         color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100',     dot: 'bg-blue-500' },
    'fresh':          { label: t('جديد', 'Fresh'),         color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100',     dot: 'bg-blue-500' },
    'Contacted':      { label: t('تم التواصل', 'Contacted'), color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100', dot: 'bg-indigo-500' },
    'Interested':     { label: t('مهتم', 'Interested'),    color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-100', dot: 'bg-purple-500' },
    'Site Visit':     { label: t('زيارة موقع', 'Site Visit'), color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100', dot: 'bg-orange-500' },
    'Negotiation':    { label: t('تفاوض', 'Negotiation'),  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100',   dot: 'bg-amber-500' },
    'Contracted':     { label: t('تعاقد', 'Contracted'),   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
    'Not Interested': { label: t('غير مهتم', 'Not Interested'), color: 'text-red-700', bg: 'bg-red-50 border-red-100',     dot: 'bg-red-500' },
    'Follow Up':      { label: t('متابعة', 'Follow Up'),   color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-100',     dot: 'bg-teal-500' },
  }

  const TEMP_CONFIG: Record<string, { icon: typeof Flame; color: string; label: string }> = {
    hot:  { icon: Flame,      color: 'text-red-500',   label: t('ساخن', 'Hot') },
    warm: { icon: TrendingUp, color: 'text-amber-500', label: t('دافئ', 'Warm') },
    cold: { icon: Target,     color: 'text-blue-400',  label: t('بارد', 'Cold') },
  }

  const params = await searchParams
  const searchQuery = params?.query || ''
  const statusFilter = params?.status || ''
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const { leads, totalPages, from, to, kpis } = await getLeadList({
    query: searchQuery,
    status: statusFilter,
    page,
    pageSize: PAGE_SIZE,
  })

  const total      = kpis.total
  const fresh      = kpis.fresh
  const contracted = kpis.contracted
  const totalValue = kpis.totalValue

  const fmt = (n: number) => new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-5 p-4 sm:p-6">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fi-emerald)] shadow-lg shadow-[var(--fi-emerald)]/20">
            <Users size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">{t('العملاء المحتملون', 'Leads')}</h1>
            <p className="text-xs text-[var(--fi-muted)]">{total} {t('عميل · قيمة متوقعة', 'leads · expected value')} {fmt(totalValue)} {t('ج.م', 'EGP')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RescoreButton />
          <BulkImportButton />
          <Link
            href="/dashboard/leads/new"
            className="fi-primary-button inline-flex min-h-9 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90 cursor-pointer"
          >
            <Plus size={15} aria-hidden="true" /> {t('إضافة عميل', 'Add Lead')}
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t('إجمالي العملاء', 'Total Leads'), value: fmt(total),      icon: '👥', color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: t('عملاء جدد', 'Fresh Leads'),      value: fmt(fresh),      icon: '✨', color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: t('تعاقدات', 'Contracted'),          value: fmt(contracted), icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: t('قيمة الخط', 'Pipeline Value'),   value: `${(totalValue / 1_000_000).toFixed(1)}M`, icon: '💰', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map(k => (
          <div key={k.label} className="flex items-center gap-3 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
            <div className={`${k.bg} flex size-10 shrink-0 items-center justify-center rounded-lg text-base`} aria-hidden="true">
              {k.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--fi-muted)]">{k.label}</p>
              <p className={`fi-tabular text-lg font-black ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <LeadFilters />

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm">
        {(!leads || leads.length === 0) ? (
          <div className="p-16 text-center">
            <Users size={40} className="mx-auto mb-3 text-[var(--fi-line)]" aria-hidden="true" />
            <p className="font-bold text-[var(--fi-ink)]">{t('لا يوجد عملاء يطابقون البحث', 'No leads match your search')}</p>
            <p className="mt-1 text-sm text-[var(--fi-muted)]">{t('جرب تغيير الفلاتر أو أضف عملاء جدد', 'Try changing filters or add new leads')}</p>
            <Link
              href="/dashboard/leads/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--fi-soft)] px-4 py-2 text-sm font-bold text-[var(--fi-emerald)] transition-colors hover:bg-[var(--fi-emerald)] hover:text-white cursor-pointer"
            >
              <Plus size={14} aria-hidden="true" /> {t('إضافة عميل جديد', 'Add New Lead')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right" aria-label={t('قائمة العملاء المحتملين', 'Leads list')}>
              <thead className="border-b border-[var(--fi-line)] bg-[var(--fi-soft)]">
                <tr>
                  {[
                    t('العميل', 'Client'),
                    t('الهاتف', 'Phone'),
                    t('الحالة', 'Status'),
                    t('الحرارة', 'Temp'),
                    t('النقاط', 'Score'),
                    t('القيمة المتوقعة', 'Expected Value'),
                    t('التاريخ', 'Date'),
                    '',
                  ].map((h, i) => (
                    <th key={i} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-bold text-[var(--fi-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {leads.map(lead => {
                  const name     = lead.full_name || lead.client_name || t('عميل', 'Lead')
                  const status   = STATUS_CONFIG[lead.status ?? 'Fresh Leads'] ?? STATUS_CONFIG['Fresh Leads']
                  const temp     = TEMP_CONFIG[lead.temperature ?? 'warm'] ?? TEMP_CONFIG.warm
                  const TempIcon = temp.icon
                  return (
                    <tr key={lead.id} className="group cursor-pointer transition-colors hover:bg-[var(--fi-soft)]/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--fi-emerald)] to-[var(--fi-emerald-2)] text-sm font-black text-white" aria-hidden="true">
                            {name.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-[var(--fi-ink)]">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {lead.phone
                          ? <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-[var(--fi-muted)] transition-colors hover:text-blue-600" dir="ltr">
                              <Phone size={11} className="text-[var(--fi-line)]" aria-hidden="true" /> {lead.phone}
                            </a>
                          : <span className="text-xs text-[var(--fi-line)]">{t('غير مسجل', 'N/A')}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${status.bg} ${status.color}`}>
                          <span className={`size-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs font-medium" title={temp.label}>
                          <TempIcon size={14} className={temp.color} aria-label={temp.label} />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {lead.score != null && lead.score > 0 ? (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${scoreColor(lead.score)}`}>
                            {lead.score} · {scoreLabel(lead.score)}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--fi-line)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="fi-tabular text-sm font-bold text-emerald-600">
                          {Number(lead.expected_value || 0) > 0
                            ? `${fmt(Number(lead.expected_value))} ${t('ج.م', 'EGP')}`
                            : <span className="text-[var(--fi-line)] font-normal">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-[var(--fi-muted)]">
                          <Calendar size={11} aria-hidden="true" />
                          {new Date(lead.created_at).toLocaleDateString(numLocale, { day: 'numeric', month: 'short' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--fi-emerald)]/10 px-2.5 py-1.5 text-[11px] font-bold text-[var(--fi-emerald)] opacity-0 transition-all hover:bg-[var(--fi-emerald)]/20 group-hover:opacity-100 cursor-pointer"
                        >
                          {t('فتح', 'Open')} <ArrowUpRight size={11} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {leads && leads.length > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--fi-line)] bg-[var(--fi-soft)]/50 px-4 py-3">
            <span className="text-xs font-medium text-[var(--fi-muted)]">
              {from + 1}–{Math.min(to + 1, total)} {t('من', 'of')} {total} {t('نتيجة', 'results')}
            </span>
            {totalPages > 1 && (
              <nav aria-label={t('ترقيم الصفحات', 'Pagination')} className="flex items-center gap-1">
                {page > 1 && (
                  <Link
                    href={`?query=${searchQuery}&status=${statusFilter}&page=${page - 1}`}
                    className="min-h-8 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] px-3 py-1 text-xs font-bold text-[var(--fi-ink)] transition-colors hover:bg-[var(--fi-soft)] cursor-pointer"
                  >
                    {t('السابق', 'Previous')}
                  </Link>
                )}
                <span className="px-3 py-1 text-xs font-bold text-[var(--fi-muted)]">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`?query=${searchQuery}&status=${statusFilter}&page=${page + 1}`}
                    className="min-h-8 rounded-lg bg-[var(--fi-emerald)] px-3 py-1 text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    {t('التالي', 'Next')}
                  </Link>
                )}
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
