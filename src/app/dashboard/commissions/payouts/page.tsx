/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy page pending migration into domains/payouts with typed DTOs. */
import Link from 'next/link'
import { DollarSign, CheckCircle, Clock, AlertCircle, ArrowUpRight, Banknote } from 'lucide-react'
import { getPayouts, getCommissionStats } from '@/domains/commissions/actions'
import CreatePayoutButton from './CreatePayoutButton'
import ApprovePayoutButton from './ApprovePayoutButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUS_CONFIG = {
  draft:            { label: 'مسودة',          color: 'text-[var(--fi-muted)]',   bg: 'bg-[var(--fi-soft)] border-[var(--fi-line)]' },
  pending_approval: { label: 'بانتظار الموافقة', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  approved:         { label: 'مُعتمد',          color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  paid:             { label: 'مدفوع',           color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled:        { label: 'ملغي',            color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
} as const

const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function PayoutsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [{ payouts, total }, stats] = await Promise.all([
    getPayouts({ status: params.status }),
    getCommissionStats(),
  ])

  return (
    <div className="p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Banknote size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">صرف العمولات</h1>
            <p className="text-xs text-[var(--fi-muted)]">{total} دفعة · إدارة وموافقة وصرف العمولات</p>
          </div>
        </div>
        <CreatePayoutButton />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'قيد الانتظار',  value: stats.pending,  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Clock },
            { label: 'مُعتمدة',       value: stats.approved, color: 'text-blue-600',    bg: 'bg-blue-50',    icon: CheckCircle },
            { label: 'مدفوعة',        value: stats.paid,     color: 'text-emerald-600', bg: 'bg-emerald-50', icon: DollarSign },
            { label: 'إجمالي',        value: stats.total,    color: 'text-[var(--fi-ink)]',   bg: 'bg-[var(--fi-soft)]',   icon: AlertCircle },
          ].map(s => (
            <div key={s.label} className="bg-[var(--fi-paper)] rounded-xl p-4 shadow-sm border border-[var(--fi-line)]">
              <div className={`${s.bg} ${s.color} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
                <s.icon size={16} />
              </div>
              <p className={`text-xl font-black ${s.color}`}>{fmt(s.value)} ج.م</p>
              <p className="text-xs text-[var(--fi-muted)] mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'الكل', value: '' },
          { label: 'بانتظار الموافقة', value: 'pending_approval' },
          { label: 'مُعتمدة', value: 'approved' },
          { label: 'مدفوعة', value: 'paid' },
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
            <p className="font-bold text-[var(--fi-muted)]">لا توجد دفعات بعد</p>
            <p className="text-sm text-[var(--fi-muted)] mt-1">اعتمد العمولات أولاً ثم أنشئ دفعة صرف</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {payouts.map((payout: any) => {
              const cfg = STATUS_CONFIG[payout.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
              const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
              const periodLabel = `${monthNames[(payout.period_month ?? 1) - 1]} ${payout.period_year}`

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
                      <span className="font-bold text-emerald-600">{fmt(payout.total_amount)} ج.م</span>
                      {payout.profiles?.full_name && (
                        <><span>·</span><span>أنشأه {payout.profiles.full_name}</span></>
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
                      تفاصيل <ArrowUpRight size={11} />
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
