import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import {
  Handshake, TrendingUp, Star,
  Clock, CheckCircle, AlertCircle,
} from 'lucide-react'

async function getBrokerDashboardData(userId: string) {
  const supabase = await createServerClient()

  const [commissionsRes, dealsRes, brokerProfileRes] = await Promise.all([
    supabase
      .from('commissions')
      .select('amount, status, created_at')
      .eq('agent_id', userId),

    supabase
      .from('deals')
      .select('id, stage, unit_value, created_at')
      .eq('agent_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('broker_profiles')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle(),
  ])

  const commissions = commissionsRes.data ?? []
  const deals = dealsRes.data ?? []
  const brokerProfile = brokerProfileRes.data

  const pendingAmount = commissions
    .filter(c => c.status === 'pending' || c.status === 'approved')
    .reduce((sum, c) => sum + (c.amount ?? 0), 0)

  const paidAmount = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + (c.amount ?? 0), 0)

  const openDeals = deals.filter(d =>
    !['closed_won', 'closed_lost'].includes(d.stage ?? '')
  ).length

  const closedWon = deals.filter(d => d.stage === 'closed_won').length

  return { commissions, deals, brokerProfile, pendingAmount, paidAmount, openDeals, closedWon }
}

export default async function BrokerPortalPage() {
  const session = await requireSession()
  const data = await getBrokerDashboardData(session.user.id)

  const stats = [
    {
      label: 'عمولات معلّقة',
      value: `${data.pendingAmount.toLocaleString('ar-EG')} ج`,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      label: 'عمولات مدفوعة',
      value: `${data.paidAmount.toLocaleString('ar-EG')} ج`,
      icon: CheckCircle,
      color: 'text-[var(--fi-emerald)]',
      bg: 'bg-[var(--fi-soft)]',
      border: 'border-green-200 dark:border-green-800',
    },
    {
      label: 'صفقات مفتوحة',
      value: data.openDeals.toString(),
      icon: Handshake,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'صفقات مغلقة',
      value: data.closedWon.toString(),
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
    },
  ]

  const STAGE_LABELS: Record<string, string> = {
    lead: 'عميل محتمل', qualified: 'مؤهّل', site_visit: 'زيارة',
    proposal: 'عرض', negotiation: 'مفاوضة', reservation: 'محجوز',
    contract: 'عقد', closed_won: 'مغلقة ✓', closed_lost: 'خسرنا',
  }

  const verificationStatus = data.brokerProfile?.verification_status ?? 'pending'
  const isVerified = verificationStatus === 'verified'
  const isPending = verificationStatus === 'pending' || verificationStatus === 'under_review'

  return (
    <div className="space-y-6" dir="rtl">
      {/* Alert: التوثيق */}
      {!isVerified && (
        <div className={`rounded-xl p-4 border flex items-start gap-3 ${
          isPending
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${isPending ? 'text-yellow-600' : 'text-red-600'}`} />
          <div>
            <p className={`font-medium text-sm ${isPending ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300'}`}>
              {isPending ? 'حسابك قيد المراجعة' : 'يجب إكمال التوثيق'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {isPending
                ? 'سيتم إشعارك عبر البريد الإلكتروني عند الموافقة على حسابك.'
                : 'أكمل رفع وثائق الهوية للحصول على صلاحيات كاملة.'}
            </p>
            {!isPending && (
              <a href="/broker-portal/profile" className="text-xs font-medium text-[var(--fi-emerald)] underline mt-1 inline-block">
                إكمال التوثيق ←
              </a>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          أهلًا، {session.profile.full_name?.split(' ')[0] ?? 'وسيط'} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          نظرة عامة على أدائك وعمولاتك
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg} ${border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Recent Deals */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Handshake className="w-4 h-4 text-[var(--fi-emerald)]" />
            آخر الصفقات
          </h2>
          <a href="/broker-portal/deals" className="text-xs text-[var(--fi-emerald)] hover:underline">عرض الكل</a>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.deals.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              لا توجد صفقات حتى الآن
            </div>
          ) : (
            data.deals.map(deal => (
              <div key={deal.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    صفقة #{deal.id.slice(0, 8)}
                  </span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(deal.created_at).toLocaleDateString('ar-EG')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {deal.unit_value && (
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {deal.unit_value.toLocaleString('ar-EG')} ج
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    deal.stage === 'closed_won'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : deal.stage === 'closed_lost'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {STAGE_LABELS[deal.stage ?? 'lead'] ?? deal.stage}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rating */}
      {data.brokerProfile && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                تقييمك: {data.brokerProfile.rating?.toFixed(1) ?? '0.0'} / 5
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                بناءً على تقييمات العملاء والإدارة
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
