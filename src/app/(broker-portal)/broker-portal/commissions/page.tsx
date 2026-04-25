import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { DollarSign, Clock, CheckCircle, Banknote, FileText, CalendarClock } from 'lucide-react'

async function getBrokerCommissions(userId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('commissions')
    .select('id, amount, agent_amount, gross_commission, status, commission_type, deal_value, percentage, beneficiary_name, notes, lifecycle_stage, broker_payout_due_date, created_at, deal_id')
    .eq('agent_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('broker commissions fetch error:', error.message)
    return { commissions: [], stats: null }
  }

  const commissions = data ?? []
  const pending  = commissions.filter(c => c.status === 'pending' || c.status === 'approved')
  const paid     = commissions.filter(c => c.status === 'paid')

  const stats = {
    pendingCount:   pending.length,
    pendingAmount:  pending.reduce((s, c)  => s + Number(c.agent_amount ?? c.amount ?? 0), 0),
    approvedAmount: commissions.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.agent_amount ?? c.amount ?? 0), 0),
    paidAmount:     paid.reduce((s, c) => s + Number(c.agent_amount ?? c.amount ?? 0), 0),
    totalEarned:    paid.reduce((s, c) => s + Number(c.agent_amount ?? c.amount ?? 0), 0),
  }

  return { commissions, stats }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:    { label: 'قيد المراجعة', color: 'text-amber-700 bg-amber-50 border-amber-200',     icon: Clock },
  approved:   { label: 'معتمدة',        color: 'text-blue-700 bg-blue-50 border-blue-200',          icon: CheckCircle },
  processing: { label: 'قيد الصرف',    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',    icon: CalendarClock },
  paid:       { label: 'مدفوعة',        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Banknote },
  cancelled:  { label: 'ملغاة',         color: 'text-red-600 bg-red-50 border-red-200',              icon: FileText },
  disputed:   { label: 'متنازع عليها', color: 'text-orange-600 bg-orange-50 border-orange-200',    icon: FileText },
}

const LIFECYCLE_SHORT: Record<string, string> = {
  pending:                        'انتظار اعتماد',
  approved:                       'تم الاعتماد',
  claim_submitted_to_developer:   'مطالبة للمطور',
  developer_commission_collected: 'تحصيل العمولة',
  broker_payout_scheduled:        'موعد محدد',
  broker_paid:                    'تم الصرف ✓',
  cancelled:                      'ملغاة',
}

const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function BrokerCommissionsPage() {
  const session = await requireSession()
  const { commissions, stats } = await getBrokerCommissions(session.user.id)

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">عمولاتي</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">تتبع جميع عمولاتك وحالة صرفها</p>
      </div>

      {/* Summary strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'قيد المراجعة', amount: stats.pendingAmount,  color: 'border-amber-200 bg-amber-50 text-amber-700' },
            { label: 'معتمدة',        amount: stats.approvedAmount, color: 'border-blue-200 bg-blue-50 text-blue-700' },
            { label: 'مدفوعة',        amount: stats.paidAmount,     color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
            { label: 'إجمالي المكتسب', amount: stats.totalEarned,  color: 'border-purple-200 bg-purple-50 text-purple-700' },
          ].map(({ label, amount, color }) => (
            <div key={label} className={`rounded-xl border p-3 ${color}`}>
              <p className="text-xs opacity-70 mb-1">{label}</p>
              <p className="text-lg font-black leading-none">{fmt(amount)}</p>
              <p className="text-[10px] opacity-60 mt-0.5">ج.م</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {commissions.length === 0 ? (
          <div className="p-14 text-center">
            <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">لا توجد عمولات حتى الآن</p>
            <p className="text-xs text-gray-400 mt-1">ستظهر عمولاتك هنا بعد إتمام أول صفقة</p>
          </div>
        ) : (
          <>
            {/* Column headers — desktop only */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-x-4 px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>العميل / المشروع</span>
              <span>مرحلة الصرف</span>
              <span className="text-center">قيمة البيعة</span>
              <span className="text-center">عمولتي</span>
              <span className="text-center">الحالة</span>
              <span className="text-left">تاريخ</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {commissions.map((c) => {
                const statusCfg = STATUS_CONFIG[c.status ?? 'pending'] ?? STATUS_CONFIG.pending
                const StatusIcon = statusCfg.icon
                const myAmount = Number(c.agent_amount ?? c.amount ?? 0)
                const notesStr = c.notes ?? ''
                const projectName = notesStr.replace(/^BRM\s+/, '').split(' - ')[0] || null
                const clientName = c.beneficiary_name ?? '—'
                const lifecycleLabel = LIFECYCLE_SHORT[c.lifecycle_stage ?? 'pending'] ?? c.lifecycle_stage ?? '—'
                const isPaid = c.lifecycle_stage === 'broker_paid'
                const hasPayoutDate = !!c.broker_payout_due_date && !isPaid

                return (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-x-4 gap-y-1.5 px-4 sm:px-5 py-3 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {/* Col 1: client + project */}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{clientName}</p>
                      {projectName && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{projectName}</p>
                      )}
                    </div>

                    {/* Col 2: lifecycle + payout date */}
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{lifecycleLabel}</span>
                      {hasPayoutDate && (
                        <span className="text-[11px] text-indigo-500 flex items-center gap-1 mt-0.5">
                          <CalendarClock className="w-3 h-3 shrink-0" />
                          {c.broker_payout_due_date}
                        </span>
                      )}
                      {isPaid && (
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                          <Banknote className="w-3 h-3 shrink-0" />
                          تم الصرف
                        </span>
                      )}
                    </div>

                    {/* Col 3: deal value */}
                    <div className="flex items-center justify-center sm:justify-end">
                      <span className="text-xs text-gray-500 sm:hidden ml-1">البيعة:</span>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {c.deal_value ? fmt(Number(c.deal_value)) : '—'} <span className="text-[10px] font-normal text-gray-400">ج.م</span>
                      </span>
                    </div>

                    {/* Col 4: commission */}
                    <div className="flex items-center justify-center sm:justify-end">
                      <span className="text-xs text-gray-500 sm:hidden ml-1">عمولتي:</span>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-700 whitespace-nowrap">
                          {fmt(myAmount)} <span className="text-[10px] font-normal text-gray-400">ج.م</span>
                        </p>
                        {c.percentage && (
                          <p className="text-[10px] text-gray-400 leading-none mt-0.5">{c.percentage}%</p>
                        )}
                      </div>
                    </div>

                    {/* Col 5: status badge */}
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.color} whitespace-nowrap`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Col 6: date */}
                    <div className="flex items-center justify-start sm:justify-end">
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
