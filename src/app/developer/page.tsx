import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Building, Package, TrendingUp, DollarSign } from 'lucide-react'
import DeveloperInventoryManager from './DeveloperInventoryManager'

export const dynamic = 'force-dynamic'

export default async function DeveloperPortalPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'developer') redirect('/dashboard')

  const { data: units } = await supabase
    .from('inventory')
    .select('*')
    .eq('developer_id', user.id)
    .order('created_at', { ascending: false })

  const safeUnits = units ?? []
  const available = safeUnits.filter(u => u.status === 'available').length
  const reserved  = safeUnits.filter(u => u.status === 'reserved').length
  const sold      = safeUnits.filter(u => u.status === 'sold').length
  const totalValue = safeUnits.filter(u => u.status !== 'sold').reduce((s, u) => s + Number(u.price ?? 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center">
            <Building size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">بوابة المطور العقاري</h1>
            <p className="text-sm text-slate-500 mt-0.5">{profile?.company_name ?? profile?.full_name ?? 'المطور'} — إدارة المخزون المباشرة</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'وحدات متاحة', value: available, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'وحدات محجوزة', value: reserved,  icon: TrendingUp, color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
          { label: 'وحدات مباعة',  value: sold,      icon: Building,   color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
          { label: 'القيمة المتاحة', value: `${(totalValue / 1_000_000).toFixed(1)}M ج.م`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
        ].map(k => (
          <div key={k.label} className={`border rounded-2xl p-4 ${k.bg}`}>
            <k.icon size={16} className={k.color} />
            <div className={`text-2xl font-black mt-2 ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      <DeveloperInventoryManager units={safeUnits} developerId={user.id} />
    </div>
  )
}
