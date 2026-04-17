import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Target, TrendingUp, Users } from 'lucide-react'
import { getTargets, setTarget } from './actions'
import TargetsClient from './TargetsClient'
import { requireAdmin } from '@/lib/require-role'

export const dynamic = 'force-dynamic'

export default async function TargetsPage() {
  await requireAdmin()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [targets, { data: agents }] = await Promise.all([
    getTargets(currentMonth),
    supabase.from('profiles').select('id, full_name').eq('role', 'agent').order('full_name'),
  ])

  const totalRevTarget = targets.reduce((s, t) => s + t.revenue_target, 0)
  const totalRevActual = targets.reduce((s, t) => s + t.revenue_actual, 0)
  const totalDealsTarget = targets.reduce((s, t) => s + t.deals_target, 0)
  const totalDealsActual = targets.reduce((s, t) => s + t.deals_actual, 0)

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Target size={20} className="text-orange-500" /> الأهداف والإنجازات الشهرية
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">تتبع أداء كل وكيل مقابل هدفه لشهر {now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الإيراد المستهدف', value: `${(totalRevTarget / 1_000_000).toFixed(1)}M`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'الإيراد المحقق فعلياً', value: `${(totalRevActual / 1_000_000).toFixed(1)}M`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'إجمالي الصفقات المستهدفة', value: totalDealsTarget, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
          { label: 'الصفقات المبرمة فعلياً', value: totalDealsActual, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
        ].map(kpi => (
          <div key={kpi.label} className={`border rounded-2xl p-4 ${kpi.bg}`}>
            <kpi.icon size={18} className={kpi.color} />
            <div className={`text-2xl font-black mt-2 ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{kpi.label}</div>
          </div>
        ))}
      </div>

      <TargetsClient
        targets={targets}
        agents={agents ?? []}
        currentMonth={currentMonth}
        setTargetAction={setTarget}
      />
    </div>
  )
}
