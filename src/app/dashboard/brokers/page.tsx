import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import BrokersList from './BrokersList'
import AddBrokerButton from './AddBrokerButton'
import { Star, TrendingUp, Users, Award, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'إدارة الوسطاء | FAST INVESTMENT' }

const TIER_CONFIG = {
  platinum: { label: 'بلاتينيوم', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', min: 10_000_000 },
  gold:     { label: 'ذهبي',      color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  min: 5_000_000 },
  silver:   { label: 'فضي',       color: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-slate-200',  min: 2_000_000 },
  bronze:   { label: 'برونزي',    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', min: 0 },
}

export default async function BrokersPage() {
  const session = await requireSession()

  if (!hasPermission(session.profile.role, 'broker.view.company') && !hasPermission(session.profile.role, 'broker.manage')) {
    redirect('/dashboard')
  }

  const service = createServiceRoleClient()

  const { data: brokers = [], error } = await service
    .from('broker_profiles')
    .select('id, profile_id, full_name, display_name, phone, email, tier, status, verification_status, total_sales, total_deals, commission_rate, join_date, specialties, profile_image')
    .is('deleted_at', null)
    .order('total_sales', { ascending: false })
    .limit(500)

  const totalBrokers  = brokers?.length ?? 0
  const activeBrokers = brokers?.filter(b =>
    b.status === 'active' || b.verification_status === 'verified'
  ).length ?? 0
  const totalSales    = brokers?.reduce((s, b) => s + Number(b.total_sales || 0), 0) ?? 0
  const totalDeals    = brokers?.reduce((s, b) => s + Number(b.total_deals || 0), 0) ?? 0

  const tierCounts = Object.keys(TIER_CONFIG).reduce((acc, tier) => {
    acc[tier] = brokers?.filter(b => b.tier === tier).length ?? 0
    return acc
  }, {} as Record<string, number>)

  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

  // Normalise rows so BrokersList always has `full_name`
  const normalisedBrokers = (brokers ?? []).map(b => ({
    ...b,
    full_name: b.full_name ?? b.display_name ?? '—',
  }))

  return (
    <div className="p-6 space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Star className="text-amber-500" size={24} /> إدارة الوسطاء العقاريين
          </h1>
          <p className="text-sm text-slate-500 mt-1">تتبع أداء الوسطاء، مستوياتهم، وعمولاتهم</p>
        </div>
        {hasPermission(session.profile.role, 'broker.manage') && <AddBrokerButton />}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center text-red-600 text-sm font-bold">
          {error.message}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الوسطاء', value: totalBrokers, sub: `${activeBrokers} نشط / معتمد`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'الصفقات المنجزة', value: totalDeals, sub: 'صفقة', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'إجمالي المبيعات', value: fmt(totalSales), sub: 'ج.م', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'وسطاء بلاتينيوم', value: tierCounts.platinum + tierCounts.gold, sub: 'بلاتينيوم + ذهبي', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-2xl p-5 shadow-sm border ${kpi.border} flex items-center gap-4`}>
            <div className={`${kpi.bg} ${kpi.color} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">{kpi.label}</p>
              <p className="text-xl font-black text-slate-900">{kpi.value}</p>
              <p className="text-[10px] text-slate-400">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(TIER_CONFIG) as [string, typeof TIER_CONFIG[keyof typeof TIER_CONFIG]][]).map(([tier, cfg]) => (
          <div key={tier} className={`bg-white rounded-2xl p-4 shadow-sm border ${cfg.border}`}>
            <div className={`text-xs font-black ${cfg.color} mb-2`}>{cfg.label}</div>
            <div className="text-3xl font-black text-slate-900">{tierCounts[tier] ?? 0}</div>
            <div className="text-[10px] text-slate-400 mt-1">
              {cfg.min > 0 ? `+${(cfg.min / 1_000_000).toFixed(0)}M مبيعات` : 'مبتدئ'}
            </div>
          </div>
        ))}
      </div>

      {totalBrokers >= 500 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
          يُعرض أول 500 وسيط — استخدم البحث للوصول لوسيط بعينه
        </div>
      )}

      {/* Brokers list */}
      <BrokersList brokers={normalisedBrokers ?? []} />
    </div>
  )
}
