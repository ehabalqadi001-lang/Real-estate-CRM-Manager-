import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CommissionsList from '@/components/commissions/CommissionsList'
import AddCommissionButton from '@/components/commissions/AddCommissionButton'
import { Wallet, CheckCircle, Clock, Users, Building2, Briefcase, HardHat } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Commission {
  id: string
  amount: number
  status: string
  commission_type?: string
  deal_value?: number
  percentage?: number
  created_at: string
  team_members?: { name?: string }
  deals?: { title?: string }
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Users; color: string; bg: string; border: string }> = {
  agent:     { label: 'وكيل',     icon: Users,      color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
  manager:   { label: 'مدير',     icon: Briefcase,  color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-100' },
  company:   { label: 'شركة',     icon: Building2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  developer: { label: 'مطور',     icon: HardHat,    color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100' },
}

export default async function CommissionsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  let commissions: Commission[] = []
  let fetchError: string | null = null
  let exactErrorDetails: string | null = null

  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('*, deals(title, value), team_members(name)')
      .order('created_at', { ascending: false })

    if (error) { exactErrorDetails = error.message; throw error }
    commissions = data || []
  } catch (e: unknown) {
    fetchError = 'تعذر جلب السجل المالي والعمولات.'
    exactErrorDetails = exactErrorDetails || (e instanceof Error ? e.message : 'Unknown error')
  }

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (Number(c.amount) || 0), 0)
  const totalPaid    = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (Number(c.amount) || 0), 0)
  const totalAll     = totalPending + totalPaid

  // Per-type breakdown
  const byType = Object.keys(TYPE_CONFIG).map(type => ({
    type,
    count:  commissions.filter(c => (c.commission_type ?? 'agent') === type).length,
    amount: commissions.filter(c => (c.commission_type ?? 'agent') === type).reduce((s, c) => s + Number(c.amount || 0), 0),
    paid:   commissions.filter(c => (c.commission_type ?? 'agent') === type && c.status === 'paid').reduce((s, c) => s + Number(c.amount || 0), 0),
  }))

  const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6 p-6" dir="rtl">

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="text-emerald-600" /> إدارة العمولات
          </h1>
          <p className="text-sm text-slate-500 mt-1">تتبع مستحقات فريق المبيعات والتحصيلات حسب النوع</p>
        </div>
        <AddCommissionButton />
      </div>

      {fetchError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
          <p className="text-red-600 font-bold mb-2">تنبيه النظام</p>
          <p className="text-sm text-slate-500 mb-4">{fetchError}</p>
          <code className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-xs font-mono inline-block" dir="ltr">
            {exactErrorDetails}
          </code>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">الإجمالي الكلي</p>
                <h3 className="text-2xl font-black text-slate-900">{fmt(totalAll)}</h3>
                <p className="text-xs text-slate-400 mt-1">{commissions.length} سجل</p>
              </div>
              <div className="bg-slate-100 p-3 rounded-full text-slate-500"><Wallet size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 mb-1">معلقة</p>
                <h3 className="text-2xl font-black text-slate-900">{fmt(totalPending)}</h3>
                <p className="text-xs text-slate-400 mt-1">{commissions.filter(c => c.status === 'pending').length} سجل</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-full text-amber-500"><Clock size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 mb-1">مصروفة</p>
                <h3 className="text-2xl font-black text-slate-900">{fmt(totalPaid)}</h3>
                <p className="text-xs text-slate-400 mt-1">{commissions.filter(c => c.status === 'paid').length} سجل</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-full text-emerald-500"><CheckCircle size={24} /></div>
            </div>
          </div>

          {/* By type breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {byType.map(({ type, count, amount, paid }) => {
              const cfg  = TYPE_CONFIG[type]
              const Icon = cfg.icon
              const pct  = amount > 0 ? ((paid / amount) * 100).toFixed(0) : '0'
              return (
                <div key={type} className={`bg-white rounded-2xl p-5 shadow-sm border ${cfg.border}`}>
                  <div className={`${cfg.bg} ${cfg.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={20} />
                  </div>
                  <p className={`text-xs font-bold ${cfg.color} mb-1`}>{cfg.label}</p>
                  <p className="text-xl font-black text-slate-900">{fmt(amount)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{count} سجل · {pct}% مدفوع</p>
                  {amount > 0 && (
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bg.replace('50','500').replace('bg-','bg-')}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Detailed list */}
          <CommissionsList commissions={commissions} />
        </>
      )}
    </div>
  )
}
