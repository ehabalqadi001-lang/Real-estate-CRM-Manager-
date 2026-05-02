import { getI18n } from '@/lib/i18n'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { redirect } from 'next/navigation'
import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  Eye,
  TrendingUp,
} from 'lucide-react'
import {
  CreateSaleClaimForm,
  ApproveClaimButton,
  RejectClaimButton,
  ReviewClaimButton,
  MarkPaidButton,
} from './SaleClaimForms'

export const dynamic = 'force-dynamic'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft:        { label: 'مسودة',         cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  submitted:    { label: 'مرفوعة',        cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  under_review: { label: 'قيد المراجعة',  cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  approved:     { label: 'معتمدة',         cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  rejected:     { label: 'مرفوضة',        cls: 'bg-red-50 text-red-700 border border-red-200' },
  paid:         { label: 'تم الصرف',       cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
}

const ALLOWED_ROLES = [
  'super_admin', 'platform_admin', 'sales_manager', 'sales_agent',
  'company_admin', 'company_owner', 'account_manager', 'agent',
  'senior_agent', 'sales_director', 'branch_manager', 'team_leader',
]
const CAN_REVIEW = [
  'super_admin', 'platform_admin', 'sales_manager', 'sales_director',
  'company_admin', 'company_owner', 'branch_manager',
]

const fmt  = (n: number | null | undefined) =>
  n != null ? new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n) : '—'
const fmtDate = (d: string | null) =>
  d ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short' }).format(new Date(d)) : '—'

export default async function SaleClaimsPage() {
  const { dir } = await getI18n()
  const session = await requireSession()
  const { profile } = session

  if (!ALLOWED_ROLES.includes(profile.role ?? '')) redirect('/dashboard')

  const companyId  = profile.company_id
  const canReview  = CAN_REVIEW.includes(profile.role ?? '')
  const supabase   = await createRawClient()

  const isManager = canReview
  const baseQuery = supabase
    .from('sale_claims')
    .select('id, claim_number, buyer_name, buyer_phone, sale_price, down_payment, commission_rate, commission_amount, contract_date, installment_years, status, notes, review_notes, reviewed_at, created_at, unit_id, agent_id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(300)

  // Agents only see their own; managers see all
  const { data: claimsRaw } = isManager
    ? await baseQuery
    : await baseQuery.eq('agent_id', profile.id)

  const { data: unitsRaw } = await supabase
    .from('inventory')
    .select('id, unit_number')
    .eq('company_id', companyId)
    .order('unit_number')
    .limit(300)

  const claims = claimsRaw ?? []
  const units  = (unitsRaw ?? []).map(u => ({ id: u.id, unit_number: u.unit_number }))

  // build unit map for display
  const unitIds = [...new Set(claims.map(c => c.unit_id).filter(Boolean))]
  let unitMap: Record<string, string> = {}
  if (unitIds.length > 0) {
    const { data: ud } = await supabase.from('inventory').select('id, unit_number').in('id', unitIds)
    for (const u of ud ?? []) unitMap[u.id] = u.unit_number
  }

  // KPIs
  const submitted    = claims.filter(c => c.status === 'submitted')
  const underReview  = claims.filter(c => c.status === 'under_review')
  const approved     = claims.filter(c => c.status === 'approved')
  const rejected     = claims.filter(c => c.status === 'rejected')
  const paid         = claims.filter(c => c.status === 'paid')

  const totalApprovedValue    = [...approved, ...paid].reduce((s, c) => s + Number(c.sale_price ?? 0), 0)
  const totalCommissionEarned = paid.reduce((s, c) => s + Number(c.commission_amount ?? 0), 0)

  const kpis = [
    { label: 'مرفوعة',        value: submitted.length,   icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { label: 'قيد المراجعة',  value: underReview.length, icon: Eye,          color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { label: 'معتمدة',         value: approved.length,   icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'مرفوضة',        value: rejected.length,   icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50'     },
  ]

  const pending = claims.filter(c => ['submitted', 'under_review'].includes(c.status))
  const history = claims.filter(c => ['approved', 'rejected', 'paid'].includes(c.status))

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <FileCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">مطالبات البيع</h1>
            <p className="text-xs text-[var(--fi-muted)]">
              رفع ومتابعة عمليات البيع — اعتماد وصرف العمولات
            </p>
          </div>
        </div>

        {/* Revenue summary for managers */}
        {isManager && (
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-xs text-[var(--fi-muted)] mb-0.5">إجمالي المبيعات المعتمدة</p>
              <p className="text-base font-black text-emerald-600">{fmt(totalApprovedValue)} ج.م</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--fi-muted)] mb-0.5">عمولات تم صرفها</p>
              <p className="text-base font-black text-blue-600">{fmt(totalCommissionEarned)} ج.م</p>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.bg}`}>
              <k.icon size={16} className={k.color} />
            </div>
            <div>
              <p className="text-xs text-[var(--fi-muted)]">{k.label}</p>
              <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Pending + history */}
        <div className="lg:col-span-2 space-y-4">

          {/* Pending claims */}
          <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--fi-line)]">
              <h2 className="font-bold text-[var(--fi-ink)]">المطالبات قيد المعالجة</h2>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                {pending.length} مطالبة
              </span>
            </div>

            {pending.length === 0 ? (
              <div className="p-10 text-center">
                <FileCheck size={32} className="mx-auto mb-2 opacity-20" />
                <p className="font-bold text-[var(--fi-ink)]">لا توجد مطالبات قيد المعالجة</p>
                <p className="text-xs text-[var(--fi-muted)] mt-1">ارفع مطالبة بيع جديدة من النموذج</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--fi-line)]">
                {pending.map(c => {
                  const st = STATUS_MAP[c.status] ?? STATUS_MAP.submitted
                  return (
                    <div key={c.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                              {c.claim_number}
                            </span>
                            <span className={`rounded-lg px-2 py-0.5 text-xs font-black ${st.cls}`}>
                              {st.label}
                            </span>
                          </div>

                          <p className="font-black text-[var(--fi-ink)]">{c.buyer_name}</p>
                          {c.buyer_phone && (
                            <p className="text-xs text-[var(--fi-muted)]">{c.buyer_phone}</p>
                          )}
                          {c.unit_id && (
                            <p className="text-xs text-[var(--fi-muted)]">
                              وحدة: {unitMap[c.unit_id] ?? c.unit_id.slice(0, 8)}
                            </p>
                          )}
                          <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                            <span className="text-xs font-bold text-[var(--fi-ink)]">
                              <TrendingUp size={10} className="inline ml-1 text-emerald-500" />
                              {fmt(c.sale_price)} ج.م
                            </span>
                            {c.commission_amount && (
                              <span className="text-xs text-blue-600 font-bold">
                                عمولة: {fmt(c.commission_amount)} ج.م
                              </span>
                            )}
                            {c.installment_years ? (
                              <span className="text-xs text-[var(--fi-muted)]">تقسيط {c.installment_years} سنة</span>
                            ) : (
                              <span className="text-xs text-[var(--fi-muted)]">نقداً</span>
                            )}
                          </div>
                          {c.notes && <p className="text-xs text-[var(--fi-muted)]">{c.notes}</p>}
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-xs text-[var(--fi-muted)]">{fmtDate(c.created_at)}</p>
                          {canReview && (
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {c.status === 'submitted' && (
                                <ReviewClaimButton claimId={c.id} />
                              )}
                              <ApproveClaimButton claimId={c.id} />
                              <RejectClaimButton  claimId={c.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* History table */}
          {history.length > 0 && (
            <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[var(--fi-line)]">
                <h2 className="font-bold text-[var(--fi-ink)]">السجل التاريخي</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--fi-soft)] text-[var(--fi-muted)] text-xs">
                      <th className="px-4 py-3 text-right font-black">الرقم</th>
                      <th className="px-4 py-3 text-right font-black">المشتري</th>
                      <th className="px-4 py-3 text-right font-black">سعر البيع</th>
                      <th className="px-4 py-3 text-right font-black">العمولة</th>
                      <th className="px-4 py-3 text-right font-black">الحالة</th>
                      <th className="px-4 py-3 text-right font-black">التاريخ</th>
                      {canReview && <th className="px-4 py-3 text-right font-black">إجراء</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--fi-line)]">
                    {history.slice(0, 100).map(c => {
                      const st = STATUS_MAP[c.status] ?? STATUS_MAP.approved
                      return (
                        <tr key={c.id} className="hover:bg-[var(--fi-soft)] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-emerald-600">{c.claim_number}</td>
                          <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{c.buyer_name}</td>
                          <td className="px-4 py-3 text-[var(--fi-muted)]">{fmt(c.sale_price)} ج.م</td>
                          <td className="px-4 py-3 text-blue-600 font-bold">
                            {c.commission_amount ? `${fmt(c.commission_amount)} ج.م` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-lg px-2 py-1 text-xs font-black ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--fi-muted)]">{fmtDate(c.created_at)}</td>
                          {canReview && (
                            <td className="px-4 py-3">
                              {c.status === 'approved' && <MarkPaidButton claimId={c.id} />}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Create form */}
        <div>
          <CreateSaleClaimForm units={units} />
        </div>
      </div>
    </div>
  )
}
