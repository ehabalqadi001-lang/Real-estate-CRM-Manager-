import { getI18n } from '@/lib/i18n'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { redirect } from 'next/navigation'
import { Bookmark, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { CreateReservationForm, CancelReservationButton, ExtendReservationButton, ConvertReservationButton } from './ReservationForms'

export const dynamic = 'force-dynamic'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:    { label: 'نشط',      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelled: { label: 'ملغى',     cls: 'bg-red-50 text-red-700 border border-red-200' },
  expired:   { label: 'منتهي',    cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  converted: { label: 'محوّل',    cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
}

const fmt  = (d: string | null) =>
  d ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short' }).format(new Date(d)) : '—'
const fmtN = (n: number | null | undefined) =>
  n != null ? new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n) : '—'

function hoursLeft(expiresAt: string | null): number {
  if (!expiresAt) return 0
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 3_600_000))
}

const ALLOWED_ROLES = [
  'super_admin', 'platform_admin', 'sales_manager', 'sales_agent',
  'company_admin', 'company_owner', 'account_manager',
]

export default async function ReservationsPage() {
  const { dir } = await getI18n()
  const session = await requireSession()
  const { profile } = session

  if (!ALLOWED_ROLES.includes(profile.role ?? '')) redirect('/dashboard')

  const companyId = profile.company_id
  const supabase  = await createRawClient()

  const [{ data: resRaw }, { data: availUnitsRaw }] = await Promise.all([
    supabase
      .from('unit_reservations')
      .select('id, client_name, client_phone, status, reserved_at, expires_at, deposit_amount, reservation_fee, extension_count, max_extensions, cancelled_at, cancel_reason, notes, unit_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(300),
    supabase
      .from('inventory')
      .select('id, unit_number')
      .eq('company_id', companyId)
      .eq('status', 'available')
      .order('unit_number')
      .limit(200),
  ])

  const reservations = resRaw ?? []

  // batch-fetch unit names
  const unitIds = [...new Set(reservations.map(r => r.unit_id).filter(Boolean))]
  let unitMap: Record<string, string> = {}
  if (unitIds.length > 0) {
    const { data: units } = await supabase
      .from('inventory')
      .select('id, unit_number')
      .in('id', unitIds)
    for (const u of units ?? []) unitMap[u.id] = u.unit_number
  }

  const availableUnits = (availUnitsRaw ?? []).map(u => ({
    id:           u.id,
    unit_number:  u.unit_number,
    project_name: '',
  }))

  // KPIs
  const now            = Date.now()
  const active         = reservations.filter(r => r.status === 'active')
  const expiringSoon   = active.filter(r => r.expires_at && new Date(r.expires_at).getTime() - now < 24 * 3_600_000)
  const cancelled      = reservations.filter(r => r.status === 'cancelled')
  const converted      = reservations.filter(r => r.status === 'converted')

  const history        = reservations.filter(r => r.status !== 'active')

  const kpis = [
    { label: 'حجوزات نشطة',       value: active.length,       icon: Bookmark,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'تنتهي خلال 24 ساعة', value: expiringSoon.length, icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { label: 'تم الإلغاء',          value: cancelled.length,   icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50'     },
    { label: 'محوّل لصفقة',         value: converted.length,   icon: CheckCircle,  color: 'text-sky-600',     bg: 'bg-sky-50'     },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
          <Bookmark size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[var(--fi-ink)]">الحجوزات</h1>
          <p className="text-xs text-[var(--fi-muted)]">
            إدارة حجوزات الوحدات — انتهاء تلقائي بعد 48 ساعة
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
        {/* Active reservations */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active */}
          <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--fi-line)]">
              <h2 className="font-bold text-[var(--fi-ink)]">الحجوزات النشطة</h2>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                {active.length} حجز
              </span>
            </div>

            {active.length === 0 ? (
              <div className="p-10 text-center">
                <Bookmark size={32} className="mx-auto mb-2 opacity-20" />
                <p className="font-bold text-[var(--fi-ink)]">لا توجد حجوزات نشطة</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--fi-line)]">
                {active.map(r => {
                  const hrs     = hoursLeft(r.expires_at)
                  const urgent  = hrs < 6
                  const warning = hrs < 24

                  return (
                    <div key={r.id} className={`p-4 ${urgent ? 'bg-red-50/40' : warning ? 'bg-amber-50/40' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-black text-[var(--fi-ink)]">{r.client_name}</p>
                          {r.client_phone && (
                            <p className="text-xs text-[var(--fi-muted)]">{r.client_phone}</p>
                          )}
                          <p className="text-xs font-bold text-[var(--fi-muted)]">
                            وحدة: {unitMap[r.unit_id] ?? r.unit_id?.slice(0, 8)}
                          </p>
                          {r.notes && (
                            <p className="text-xs text-[var(--fi-muted)]">{r.notes}</p>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            {r.reservation_fee > 0 && (
                              <span className="text-xs text-[var(--fi-muted)]">
                                رسوم: {fmtN(r.reservation_fee)} ج.م
                              </span>
                            )}
                            {r.deposit_amount && (
                              <span className="text-xs text-[var(--fi-muted)]">
                                تأمين: {fmtN(r.deposit_amount)} ج.م
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black ${
                            urgent  ? 'bg-red-100 text-red-700'    :
                            warning ? 'bg-amber-100 text-amber-700' :
                                      'bg-emerald-50 text-emerald-700'
                          }`}>
                            <Clock size={12} />
                            {hrs === 0 ? 'منتهي الآن' : `${hrs} ساعة متبقية`}
                          </div>
                          <p className="text-xs text-[var(--fi-muted)]">
                            تنتهي: {fmt(r.expires_at)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap justify-end">
                            <ConvertReservationButton reservationId={r.id} />
                            <ExtendReservationButton
                              reservationId={r.id}
                              extensionCount={r.extension_count ?? 0}
                              maxExtensions={r.max_extensions ?? 2}
                            />
                            <CancelReservationButton reservationId={r.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-[var(--fi-line)]">
                <RefreshCw size={15} className="text-[var(--fi-muted)]" />
                <h2 className="font-bold text-[var(--fi-ink)]">السجل التاريخي</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--fi-soft)] text-[var(--fi-muted)] text-xs">
                      <th className="px-4 py-3 text-right font-black">العميل</th>
                      <th className="px-4 py-3 text-right font-black">الوحدة</th>
                      <th className="px-4 py-3 text-right font-black">الحالة</th>
                      <th className="px-4 py-3 text-right font-black">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--fi-line)]">
                    {history.slice(0, 50).map(r => {
                      const st = STATUS_MAP[r.status] ?? { label: r.status, cls: 'bg-slate-100 text-slate-600' }
                      return (
                        <tr key={r.id} className="hover:bg-[var(--fi-soft)] transition-colors">
                          <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{r.client_name}</td>
                          <td className="px-4 py-3 text-[var(--fi-muted)]">{unitMap[r.unit_id] ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-lg px-2 py-1 text-xs font-black ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3 text-[var(--fi-muted)]">{fmt(r.reserved_at)}</td>
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
          <CreateReservationForm availableUnits={availableUnits} />
        </div>
      </div>
    </div>
  )
}
