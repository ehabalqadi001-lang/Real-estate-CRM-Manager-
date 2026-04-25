import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { DollarSign, Clock, CheckCircle, Banknote, FileText, Send, CalendarClock } from 'lucide-react'

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
  pending:   { label: 'قيد المراجعة', color: 'text-yellow-600 bg-yellow-50 border-yellow-200',  icon: Clock },
  approved:  { label: 'معتمدة',        color: 'text-blue-600 bg-blue-50 border-blue-200',          icon: CheckCircle },
  processing:{ label: 'قيد الصرف',    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',    icon: CalendarClock },
  paid:      { label: 'مدفوعة',        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Banknote },
  cancelled: { label: 'ملغاة',         color: 'text-red-600 bg-red-50 border-red-200',              icon: FileText },
  disputed:  { label: 'متنازع عليها', color: 'text-orange-600 bg-orange-50 border-orange-200',    icon: FileText },
}

const LIFECYCLE_LABELS: Record<string, string> = {
  pending:                        'بانتظار الاعتماد',
  approved:                       'تم اعتماد البيع',
  claim_submitted_to_developer:   'تم تقديم المطالبة للمطور',
  developer_commission_collected: 'تم تحصيل العمولة من المطور',
  broker_payout_scheduled:        'موعد الصرف محدد',
  broker_paid:                    'تم الصرف',
  cancelled:                      'ملغاة',
}

const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function BrokerCommissionsPage() {
  const session = await requireSession()
  const { commissions, stats } = await getBrokerCommissions(session.user.id)

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">عمولاتي</h1>
        <p className="text-gray-500 text-sm mt-1">تتبع جميع عمولاتك وحالة صرفها</p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'قيد المراجعة', amount: stats.pendingAmount, count: stats.pendingCount, colorClass: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'معتمدة',        amount: stats.approvedAmount, count: null, colorClass: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'مدفوعة',        amount: stats.paidAmount, count: null, colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { label: 'إجمالي المكتسب', amount: stats.totalEarned, count: null, colorClass: 'bg-purple-50 border-purple-200 text-purple-700' },
          ].map(({ label, amount, count, colorClass }) => (
            <div key={label} className={`rounded-xl border p-4 ${colorClass}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-70">{label}</span>
                <DollarSign className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-xl font-bold">{fmt(amount)} ج.م</div>
              {count !== null && <div className="text-xs opacity-60 mt-1">{count} عمولة</div>}
            </div>
          ))}
        </div>
      )}

      {/* Commissions List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">سجل العمولات</h2>
        </div>

        {commissions.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد عمولات حتى الآن</p>
            <p className="text-xs text-gray-400 mt-1">ستظهر عمولاتك هنا بعد إتمام أول صفقة</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {commissions.map((c) => {
              const statusCfg = STATUS_CONFIG[c.status ?? 'pending'] ?? STATUS_CONFIG.pending
              const StatusIcon = statusCfg.icon
              const myAmount = Number(c.agent_amount ?? c.amount ?? 0)
              // Parse project name from notes: "BRM <project> - <stage>"
              const notesStr = c.notes ?? ''
              const projectName = notesStr.replace(/^BRM\s+/, '').split(' - ')[0] || null
              const clientName = c.beneficiary_name ?? '—'
              const lifecycleLabel = LIFECYCLE_LABELS[c.lifecycle_stage ?? 'pending'] ?? c.lifecycle_stage ?? '—'

              return (
                <div key={c.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {lifecycleLabel}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                        {clientName}
                      </p>
                      {projectName && (
                        <p className="text-xs text-gray-500 mt-0.5">{projectName}</p>
                      )}
                      {c.broker_payout_due_date && (
                        <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          موعد الصرف: {c.broker_payout_due_date}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-emerald-700">{fmt(myAmount)} ج.م</p>
                      {c.deal_value && (
                        <p className="text-xs text-gray-400">قيمة البيع: {fmt(Number(c.deal_value))} ج.م</p>
                      )}
                      {c.percentage && (
                        <p className="text-xs text-gray-400">نسبة: {c.percentage}%</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">
                        {new Date(c.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Request Payout CTA */}
      {stats && stats.approvedAmount > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-emerald-800">
              لديك {fmt(stats.approvedAmount)} ج.م عمولات معتمدة جاهزة للصرف
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              تواصل مع Account Manager لتحديد موعد الصرف
            </p>
          </div>
          <Send className="size-6 text-emerald-600 shrink-0" />
        </div>
      )}
    </div>
  )
}
