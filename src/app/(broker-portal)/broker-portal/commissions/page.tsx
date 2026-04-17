import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { DollarSign, Clock, CheckCircle, Banknote, FileText } from 'lucide-react'

async function getBrokerCommissions(userId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('commissions')
    .select(`
      id, amount, status, commission_type, deal_value, percentage,
      created_at, updated_at,
      deals!deal_id (
        id, stage, unit_value,
        leads!lead_id ( client_name ),
        inventory!unit_id ( unit_name, projects!project_id ( name ) )
      )
    `)
    .eq('agent_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { commissions: [], stats: null }

  const commissions = data ?? []
  const pending = commissions.filter(c => c.status === 'pending')
  const approved = commissions.filter(c => c.status === 'approved')
  const paid = commissions.filter(c => c.status === 'paid')

  const stats = {
    pendingCount:  pending.length,
    pendingAmount: pending.reduce((s, c) => s + (c.amount ?? 0), 0),
    approvedAmount: approved.reduce((s, c) => s + (c.amount ?? 0), 0),
    paidAmount:    paid.reduce((s, c) => s + (c.amount ?? 0), 0),
    totalEarned:   paid.reduce((s, c) => s + (c.amount ?? 0), 0),
  }

  return { commissions, stats }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:  { label: 'معلّقة',   color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', icon: Clock },
  approved: { label: 'معتمدة',  color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',       icon: CheckCircle },
  paid:     { label: 'مدفوعة',  color: 'text-green-600 bg-green-50 dark:bg-green-900/20',    icon: Banknote },
  rejected: { label: 'مرفوضة', color: 'text-red-600 bg-red-50 dark:bg-red-900/20',           icon: FileText },
}

type RelationRecord = Record<string, unknown>

function firstRelation(value: unknown): RelationRecord | null {
  if (Array.isArray(value)) {
    return (value[0] as RelationRecord | undefined) ?? null
  }

  return (value as RelationRecord | null) ?? null
}

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
            { label: 'معلّقة', amount: stats.pendingAmount, count: stats.pendingCount, color: 'yellow' },
            { label: 'معتمدة', amount: stats.approvedAmount, count: null, color: 'blue' },
            { label: 'مدفوعة', amount: stats.paidAmount, count: null, color: 'green' },
            { label: 'إجمالي المكتسب', amount: stats.totalEarned, count: null, color: 'purple' },
          ].map(({ label, amount, count, color }) => (
            <div
              key={label}
              className={`rounded-xl border p-4 bg-${color}-50 dark:bg-${color}-900/20 border-${color}-200 dark:border-${color}-800`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{label}</span>
                <DollarSign className={`w-4 h-4 text-${color}-600`} />
              </div>
              <div className={`text-xl font-bold text-${color}-700 dark:text-${color}-400`}>
                {amount.toLocaleString('ar-EG')} ج
              </div>
              {count !== null && (
                <div className="text-xs text-gray-500 mt-1">{count} عمولة</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Commissions Table */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">العميل / المشروع</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">قيمة الصفقة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">نسبة العمولة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">قيمة العمولة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {commissions.map((c) => {
                  const statusCfg = STATUS_CONFIG[c.status ?? 'pending'] ?? STATUS_CONFIG.pending
                  const StatusIcon = statusCfg.icon
                  const deal = firstRelation(c.deals)
                  const lead = firstRelation(deal?.leads)
                  const inventory = firstRelation(deal?.inventory)
                  const project = firstRelation(inventory?.projects)
                  const clientName = typeof lead?.client_name === 'string' ? lead.client_name : '—'
                  const unitName = typeof inventory?.unit_name === 'string' ? inventory.unit_name : ''
                  const projectName = typeof project?.name === 'string' ? project.name : ''

                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {clientName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {unitName} {projectName ? `• ${projectName}` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {c.deal_value ? `${c.deal_value.toLocaleString('ar-EG')} ج` : '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {c.percentage ? `${c.percentage}%` : '—'}
                      </td>
                      <td className="px-5 py-3 font-semibold text-green-700 dark:text-green-400">
                        {c.amount ? `${c.amount.toLocaleString('ar-EG')} ج` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {new Date(c.created_at).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Payout */}
      {stats && stats.approvedAmount > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">
              يمكنك طلب صرف {stats.approvedAmount.toLocaleString('ar-EG')} ج
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              لديك عمولات معتمدة وجاهزة للصرف
            </p>
          </div>
          <a
            href="/dashboard/commissions/payouts"
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            طلب الصرف
          </a>
        </div>
      )}
    </div>
  )
}
