import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { Handshake, Clock, CheckCircle2, XCircle, AlertCircle, FileSearch, CalendarClock, Banknote } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'صفقاتي | FAST INVESTMENT' }

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

const STATUS = {
  submitted:    { label: 'قيد المراجعة',    color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock },
  under_review: { label: 'جارٍ المراجعة',   color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: FileSearch },
  approved:     { label: 'معتمدة',           color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected:     { label: 'مرفوضة',          color: 'bg-red-50 text-red-600 border-red-200',          icon: XCircle },
} as const

const LIFECYCLE = {
  sale_submitted:                 { label: 'تم رفع البيع',              color: 'text-gray-500' },
  sale_approved:                  { label: 'تم اعتماد البيع',           color: 'text-emerald-600' },
  claim_submitted_to_developer:   { label: 'مطالبة للمطور',             color: 'text-blue-600' },
  developer_commission_collected: { label: 'تحصيل العمولة',             color: 'text-indigo-600' },
  broker_payout_scheduled:        { label: 'موعد الصرف محدد',           color: 'text-purple-600' },
  broker_paid:                    { label: 'تم الصرف ✓',                color: 'text-emerald-700' },
  rejected:                       { label: 'مرفوضة',                    color: 'text-red-600' },
} as const

const STAGE = { eoi: 'EOI', reservation: 'حجز', contract: 'عقد' } as const

async function getBrokerSales(userId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('broker_sales_submissions')
    .select('id, client_name, project_name, developer_name, unit_code, unit_type, deal_value, broker_commission_amount, broker_commission_rate, stage, status, commission_lifecycle_stage, rejection_reason, broker_payout_due_date, broker_paid_at, created_at')
    .eq('broker_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('broker deals fetch error:', error.message)
    return []
  }
  return data ?? []
}

export default async function DealsPage() {
  const session = await requireSession()
  const sales = await getBrokerSales(session.user.id)

  const counts = {
    total:    sales.length,
    approved: sales.filter(s => s.status === 'approved').length,
    pending:  sales.filter(s => s.status === 'submitted' || s.status === 'under_review').length,
    rejected: sales.filter(s => s.status === 'rejected').length,
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">صفقاتي</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">متابعة جميع صفقاتك المعتمدة والجارية</p>
      </div>

      {/* KPI strip */}
      {sales.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'الكل', value: counts.total, color: 'border-gray-200 bg-gray-50 text-gray-700' },
            { label: 'معتمدة', value: counts.approved, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
            { label: 'قيد المراجعة', value: counts.pending, color: 'border-amber-200 bg-amber-50 text-amber-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sales list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {sales.length === 0 ? (
          <div className="p-16 text-center">
            <Handshake className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-base font-bold text-gray-600 dark:text-gray-400">لا توجد صفقات بعد</h2>
            <p className="text-sm text-gray-400 mt-1">ستظهر هنا صفقاتك بعد رفع أول مبيعة</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sales.map((sale) => {
              const st = STATUS[sale.status as keyof typeof STATUS] ?? STATUS.submitted
              const StatusIcon = st.icon
              const lc = LIFECYCLE[sale.commission_lifecycle_stage as keyof typeof LIFECYCLE]
              const stageName = STAGE[sale.stage as keyof typeof STAGE] ?? sale.stage?.toUpperCase() ?? '—'
              const isPaid = sale.commission_lifecycle_stage === 'broker_paid'

              return (
                <div key={sale.id} className="p-4 sm:p-5">
                  {/* Row 1: status + stage + date */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${st.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {st.label}
                    </span>
                    <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                      {stageName}
                    </span>
                    {lc && sale.status === 'approved' && (
                      <span className={`text-xs font-bold ${lc.color}`}>• {lc.label}</span>
                    )}
                    <span className="mr-auto text-xs text-gray-400">
                      {new Date(sale.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  {/* Row 2: client + project */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{sale.client_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {sale.project_name}
                        {sale.developer_name ? ` • ${sale.developer_name}` : ''}
                        {sale.unit_code ? ` • وحدة ${sale.unit_code}` : ''}
                      </p>
                    </div>
                    {/* Amounts */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-gray-800 dark:text-gray-100">{fmt(Number(sale.deal_value))} ج.م</p>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">
                        عمولتي: {fmt(Number(sale.broker_commission_amount))} ج.م
                        <span className="text-gray-400 font-normal"> ({sale.broker_commission_rate}%)</span>
                      </p>
                    </div>
                  </div>

                  {/* Row 3: payout info or rejection */}
                  {sale.rejection_reason && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{sale.rejection_reason}</span>
                    </div>
                  )}
                  {isPaid && sale.broker_paid_at && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
                      <Banknote className="w-3.5 h-3.5" />
                      تم الصرف في {new Date(sale.broker_paid_at).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                  {sale.broker_payout_due_date && !isPaid && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5">
                      <CalendarClock className="w-3.5 h-3.5" />
                      موعد الصرف المحدد: {sale.broker_payout_due_date}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
