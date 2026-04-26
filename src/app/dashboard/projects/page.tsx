import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Building2, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react'
import AddProjectButton from './AddProjectButton'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single()
  const targetCompanyId = profile?.company_id || user?.id

  // Group inventory by project_name (works even before projects table is migrated)
  const { data: units } = await supabase
    .from('inventory')
    .select('id, project_name, unit_type, status, price, floor, area, unit_name')
    .eq('company_id', targetCompanyId)
    .order('project_name')

  // Build project summaries from flat inventory
  const projectMap = new Map<string, {
    name: string
    total: number
    available: number
    reserved: number
    sold: number
    totalValue: number
    types: Set<string>
  }>()

  for (const u of units ?? []) {
    const key = u.project_name || 'غير محدد'
    if (!projectMap.has(key)) {
      projectMap.set(key, { name: key, total: 0, available: 0, reserved: 0, sold: 0, totalValue: 0, types: new Set() })
    }
    const p = projectMap.get(key)!
    p.total += 1
    const st = (u.status ?? '').toLowerCase()
    if (st === 'available') { p.available += 1; p.totalValue += Number(u.price || 0) }
    else if (st === 'reserved') p.reserved += 1
    else if (st === 'sold') p.sold += 1
    if (u.unit_type) p.types.add(u.unit_type)
  }

  const projects = Array.from(projectMap.values()).sort((a, b) => b.total - a.total)

  const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00C27C] rounded-xl flex items-center justify-center shadow-lg shadow-[#00C27C]/20">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">هيكل المشاريع</h1>
            <p className="text-xs text-slate-400">
              {projects.length} مشروع · {units?.length ?? 0} وحدة إجمالية
            </p>
          </div>
        </div>
        <AddProjectButton />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي المشاريع', value: projects.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'وحدات متاحة', value: projects.reduce((s, p) => s + p.available, 0), color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'وحدات محجوزة', value: projects.reduce((s, p) => s + p.reserved, 0), color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'وحدات مباعة', value: projects.reduce((s, p) => s + p.sold, 0), color: 'text-red-600', bg: 'bg-red-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className={`${k.bg} w-9 h-9 rounded-lg flex items-center justify-center`}>
              <span className={`text-sm font-black ${k.color}`}>{k.value}</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{k.label}</p>
              <p className={`text-base font-black ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(project => {
          const soldRate = project.total > 0 ? Math.round((project.sold / project.total) * 100) : 0
          return (
            <Link
              key={project.name}
              href={`/dashboard/inventory?project=${encodeURIComponent(project.name)}`}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-[#00C27C]/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base group-hover:text-[#00C27C] transition-colors">{project.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{Array.from(project.types).join(' · ')}</p>
                </div>
                <div className="bg-[#00C27C]/10 text-[#00C27C] text-xs font-black px-2.5 py-1 rounded-lg">
                  {project.total} وحدة
                </div>
              </div>

              {/* Status bar */}
              <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-3">
                {project.available > 0 && (
                  // eslint-disable-next-line no-inline-styles/no-inline-styles
                  <div className="bg-emerald-400 rounded-full" style={{ width: `${(project.available / project.total) * 100}%` }} />
                )}
                {project.reserved > 0 && (
                  // eslint-disable-next-line no-inline-styles/no-inline-styles
                  <div className="bg-amber-400 rounded-full" style={{ width: `${(project.reserved / project.total) * 100}%` }} />
                )}
                {project.sold > 0 && (
                  // eslint-disable-next-line no-inline-styles/no-inline-styles
                  <div className="bg-red-400 rounded-full" style={{ width: `${(project.sold / project.total) * 100}%` }} />
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle size={11} /> {project.available} متاح
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Clock size={11} /> {project.reserved} محجوز
                  </span>
                  <span className="flex items-center gap-1 text-red-500 font-bold">
                    <XCircle size={11} /> {project.sold} مباع
                  </span>
                </div>
                <span className="flex items-center gap-1 text-purple-600 font-bold">
                  <TrendingUp size={11} /> {soldRate}%
                </span>
              </div>

              {project.totalValue > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <p className="text-xs text-slate-400">قيمة المتاح</p>
                  <p className="text-sm font-black text-[#00C27C]">{fmt(project.totalValue)} ج.م</p>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
