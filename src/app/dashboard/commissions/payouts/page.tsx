/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy page pending migration into domains/payouts with typed DTOs. */
import Link from 'next/link'
import { DollarSign, CheckCircle, Clock, AlertCircle, ArrowUpRight, Banknote } from 'lucide-react'
import { getPayouts, getCommissionStats } from '@/domains/commissions/actions'
import { getI18n } from '@/lib/i18n'
import CreatePayoutButton from './CreatePayoutButton'
import ApprovePayoutButton from './ApprovePayoutButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function PayoutsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [{ payouts, total }, stats, { t, numLocale }] = await Promise.all([
    getPayouts({ status: params.status }),
    getCommissionStats(),
    getI18n(),
  ])

  const STATUS_CONFIG = {
    draft:            { label: t('مسودة', 'Draft'),                  color: 'text-[var(--fi-muted)]',   bg: 'bg-[var(--fi-soft)] border-[var(--fi-line)]' },
    pending_approval: { label: t('بانتظار الموافقة', 'Pending Approval'), color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
    approved:         { label: t('مُعتمد', 'Approved'),              color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
    paid:             { label: t('مدفوع', 'Paid'),                    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    cancelled:        { label: t('ملغي', 'Cancelled'),               color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
  }

  const fmt = (n: number) => new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(n)
  const fmtMonth = new Intl.DateTimeFormat(numLocale, { month: 'long' })

  return (
    <div className="p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Banknote size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">{t('صرف العمولات', 'Commission Payouts')}</h1>
            <p className="text-xs text-[var(--fi-muted)]">{total} {t('دفعة · إدارة وموافقة وصرف العمولات', 'payouts · manage, approve, and disburse commissions')}</p>
          </div>
        </div>
        <CreatePayoutButton />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t('قيد الانتظار', 'Pending'),  value: stats.pending,  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock },
            { label: t('مُعتمدة', 'Approved'),       value: stats.approved, color: 'text-blue-600',    bg: 'bg-blue-50',    icon: CheckCircle },
            { label: t('مدفوعة', 'Paid'),            value: stats.paid,     color: 'text-emerald-600', bg: 'bg-emerald-50', icon: DollarSign },
            { label: t('إجمالي', 'Total'),           value: stats.total,    color: 'text-[var(--fi-ink)]',   bg: 'bg-[var(--fi-soft)]',   icon: AlertCircle },
          ].map(s => (
            <div key={s.label} className="bg-[var(--fi-paper)] rounded-xl p-4 shadow-sm border border-[var(--fi-line)]">
              <div className={`${s.bg} ${s.color} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
                <s.icon size={16} />
              </div>
              <p className={`text-xl font-black ${s.color}`}>{fmt(s.value)} {t('ج.م', 'EGP')}</p>
              <p className="text-xs text-[var(--fi-muted)] mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: t('الكل', 'All'), value: '' },
          { label: t('بانتظار الموافقة', 'Pending Approval'), value: 'pending_approval' },
          { label: t('مُعتمدة', 'Approved'), value: 'approved' },
          { label: t('مدفوعة', 'Paid'), value: 'paid' },
        ].map(tab => (
          <Link
            key={tab.value}
            href={tab.value ? `?status=${tab.value}` : '?'}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              (params.status ?? '') === tab.value
                ? 'bg-[#0B1120] text-white'
                : 'bg-[var(--fi-paper)] border border-[var(--fi-line)] text-[var(--fi-muted)] hover:bg-[var(--fi-soft)]'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Payouts list */}
      <div className="bg-[var(--fi-paper)] rounded-2xl shadow-sm border border-[var(--fi-line)] overflow-hidden">
        {payouts.length === 0 ? (
          <div className="p-16 text-center">
            <Banknote size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="font-bold text-[var(--fi-muted)]">{t('لا توجد دفعات بعد', 'No payouts yet')}</p>
            <p className="text-sm text-[var(--fi-muted)] mt-1">{t('اعتمد العمولات أولاً ثم أنشئ دفعة صرف', 'Approve commissions first, then create a payout')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {payouts.map((payout: any) => {
              const cfg = STATUS_CONFIG[payout.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
              const periodLabel = `${fmtMonth.format(new Date(payout.period_year, (payout.period_month ?? 1) - 1))} ${payout.period_year}`

              return (
                <div key={payout.id} className="p-4 hover:bg-[var(--fi-soft)]/60 transition-colors flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-[var(--fi-ink)] text-sm truncate">{payout.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--fi-muted)]">
                      <span>{periodLabel}</span>
                      <span>·</span>
                      <span className="font-bold text-emerald-600">{fmt(payout.total_amount)} {t('ج.م', 'EGP')}</span>
                      {payout.profiles?.full_name && (
                        <><span>·</span><span>{t('أنشأه', 'Created by')} {payout.profiles.full_name}</span></>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {payout.status === 'pending_approval' && (
                      <ApprovePayoutButton payoutId={payout.id} />
                    )}
                    <Link
                      href={`/dashboard/commissions/payouts/${payout.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--fi-muted)] hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      {t('تفاصيل', 'Details')} <ArrowUpRight size={11} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
