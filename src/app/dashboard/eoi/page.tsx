import { getI18n } from '@/lib/i18n'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { redirect } from 'next/navigation'
import { ClipboardList, Clock, CheckCircle, XCircle, ArrowRightCircle } from 'lucide-react'
import { CreateEOIForm, ApproveEOIButton, RejectEOIButton, ConvertEOIButton } from './EOIForms'

export const dynamic = 'force-dynamic'

const fmt  = (d: string | null, locale: string) =>
  d ? new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(new Date(d)) : '—'
const fmtN = (n: number | null | undefined, locale: string) =>
  n != null ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n) : '—'

const ALLOWED_ROLES = [
  'super_admin', 'platform_admin', 'sales_manager', 'sales_agent',
  'company_admin', 'company_owner', 'account_manager',
]
const CAN_REVIEW = [
  'super_admin', 'platform_admin', 'sales_manager', 'company_admin', 'company_owner',
]

export default async function EOIPage() {
  const { t, numLocale } = await getI18n()
  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    pending:   { label: t('قيد المراجعة', 'Pending'),   cls: 'bg-amber-50 text-amber-700 border border-amber-200'   },
    approved:  { label: t('معتمد', 'Approved'),          cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    rejected:  { label: t('مرفوض', 'Rejected'),         cls: 'bg-red-50 text-red-700 border border-red-200'           },
    converted: { label: t('محوّل', 'Converted'),         cls: 'bg-sky-50 text-sky-700 border border-sky-200'           },
    expired:   { label: t('منتهي', 'Expired'),           cls: 'bg-slate-100 text-slate-500 border border-slate-200'    },
  }
  const session = await requireSession()
  const { profile } = session

  if (!ALLOWED_ROLES.includes(profile.role ?? '')) redirect('/dashboard')

  const companyId  = profile.company_id
  const canReview  = CAN_REVIEW.includes(profile.role ?? '')
  const supabase   = await createRawClient()

  const [{ data: eoisRaw }, { data: unitsRaw }] = await Promise.all([
    supabase
      .from('eoi_requests')
      .select('id, eoi_number, client_name, client_phone, client_email, status, amount, notes, expiry_date, created_at, unit_id, agent_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(300),
    supabase
      .from('inventory')
      .select('id, unit_number')
      .eq('company_id', companyId)
      .order('unit_number')
      .limit(300),
  ])

  const eois  = eoisRaw  ?? []
  const units = (unitsRaw ?? []).map(u => ({
    id:           u.id,
    unit_number:  u.unit_number,
    project_name: '',
  }))

  // batch unit names for display
  const unitIds = [...new Set(eois.map(e => e.unit_id).filter(Boolean))]
  let unitMap: Record<string, string> = {}
  if (unitIds.length > 0) {
    const { data: uDetails } = await supabase
      .from('inventory')
      .select('id, unit_number')
      .in('id', unitIds)
    for (const u of uDetails ?? []) unitMap[u.id] = u.unit_number
  }

  // KPIs
  const pending   = eois.filter(e => e.status === 'pending')
  const approved  = eois.filter(e => e.status === 'approved')
  const rejected  = eois.filter(e => e.status === 'rejected')
  const converted = eois.filter(e => e.status === 'converted')

  const history = eois.filter(e => e.status !== 'pending')

  const kpis = [
    { label: t('قيد المراجعة', 'Pending'),    value: pending.length,   icon: Clock,            color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { label: t('معتمدة', 'Approved'),          value: approved.length,  icon: CheckCircle,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('مرفوضة', 'Rejected'),          value: rejected.length,  icon: XCircle,          color: 'text-red-600',     bg: 'bg-red-50'     },
    { label: t('محوّلة لصفقة', 'Converted'),   value: converted.length, icon: ArrowRightCircle, color: 'text-sky-600',     bg: 'bg-sky-50'     },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center">
          <ClipboardList size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[var(--fi-ink)]">{t('خطابات النية (EOI)', 'Expression of Interest (EOI)')}</h1>
          <p className="text-xs text-[var(--fi-muted)]">
            {t('تتبع اهتمام العملاء وتحويلها إلى صفقات', 'Track client interest and convert to deals')}
          </p>
        </div>
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
        {/* Pending EOIs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--fi-line)]">
              <h2 className="font-bold text-[var(--fi-ink)]">{t('قيد المراجعة', 'Pending Review')}</h2>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                {pending.length} {t('خطاب', 'letters')}
              </span>
            </div>

            {pending.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList size={32} className="mx-auto mb-2 opacity-20" />
                <p className="font-bold text-[var(--fi-ink)]">{t('لا توجد خطابات قيد المراجعة', 'No pending EOIs')}</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--fi-line)]">
                {pending.map(e => (
                  <div key={e.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                            {e.eoi_number}
                          </span>
                        </div>
                        <p className="font-black text-[var(--fi-ink)]">{e.client_name}</p>
                        {e.client_phone && (
                          <p className="text-xs text-[var(--fi-muted)]">{e.client_phone}</p>
                        )}
                        {e.client_email && (
                          <p className="text-xs text-[var(--fi-muted)]">{e.client_email}</p>
                        )}
                        {e.unit_id && (
                          <p className="text-xs text-[var(--fi-muted)]">
                            {t('وحدة:', 'Unit:')} {unitMap[e.unit_id] ?? e.unit_id.slice(0, 8)}
                          </p>
                        )}
                        {e.amount && (
                          <p className="text-xs font-bold text-[var(--fi-ink)]">
                            {t('المبلغ:', 'Amount:')} {fmtN(e.amount, numLocale)} EGP
                          </p>
                        )}
                        {e.notes && (
                          <p className="text-xs text-[var(--fi-muted)]">{e.notes}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-xs text-[var(--fi-muted)]">
                          {t('صالح حتى:', 'Valid until:')} {fmt(e.expiry_date, numLocale)}
                        </p>
                        <p className="text-xs text-[var(--fi-muted)]">
                          {t('بتاريخ:', 'Date:')} {fmt(e.created_at, numLocale)}
                        </p>
                        {canReview && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap justify-end">
                            <ApproveEOIButton eoiId={e.id} />
                            <RejectEOIButton  eoiId={e.id} />
                            <ConvertEOIButton eoiId={e.id} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[var(--fi-line)]">
                <h2 className="font-bold text-[var(--fi-ink)]">{t('السجل التاريخي', 'History')}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--fi-soft)] text-[var(--fi-muted)] text-xs">
                      <th className="px-4 py-3 text-right font-black">{t('الرقم','No.')}</th>
                      <th className="px-4 py-3 text-right font-black">{t('العميل','Client')}</th>
                      <th className="px-4 py-3 text-right font-black">{t('المبلغ','Amount')}</th>
                      <th className="px-4 py-3 text-right font-black">{t('الحالة','Status')}</th>
                      <th className="px-4 py-3 text-right font-black">{t('التاريخ','Date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--fi-line)]">
                    {history.slice(0, 50).map(e => {
                      const st = STATUS_MAP[e.status] ?? { label: e.status, cls: 'bg-slate-100 text-slate-600' }
                      return (
                        <tr key={e.id} className="hover:bg-[var(--fi-soft)] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[var(--fi-muted)]">{e.eoi_number}</td>
                          <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{e.client_name}</td>
                          <td className="px-4 py-3 text-[var(--fi-muted)]">{e.amount ? `${fmtN(e.amount, numLocale)} EGP` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-lg px-2 py-1 text-xs font-black ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3 text-[var(--fi-muted)]">{fmt(e.created_at, numLocale)}</td>
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
          <CreateEOIForm units={units} />
        </div>
      </div>
    </div>
  )
}
