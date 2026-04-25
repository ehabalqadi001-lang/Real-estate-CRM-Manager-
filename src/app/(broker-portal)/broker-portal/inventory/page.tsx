import { Building2, Percent, MapPin, Search } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'المخزون | FAST INVESTMENT' }

async function getInventoryData() {
  const supabase = await createServerClient()

  const [projectsRes, developersRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, developer_id, developer_name, region, status, commission_rate, description')
      .eq('status', 'active')
      .order('commission_rate', { ascending: false })
      .limit(50),
    supabase
      .from('developers')
      .select('id, name, name_ar, region')
      .eq('active', true)
      .order('name')
      .limit(50),
  ])

  return {
    projects: projectsRes.data ?? [],
    developers: developersRes.data ?? [],
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function InventoryPage() {
  await requireSession()
  const { projects, developers } = await getInventoryData()

  // Group projects by developer
  const byDeveloper = projects.reduce<Record<string, typeof projects>>((acc, p) => {
    const key = p.developer_name ?? p.developer_id ?? 'أخرى'
    acc[key] = [...(acc[key] ?? []), p]
    return acc
  }, {})

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">المخزون المتاح</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {projects.length} مشروع نشط — ابدأ بالأعلى عمولةً
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3 text-center">
            <p className="text-2xl font-black text-emerald-700">{projects.length}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">مشاريع نشطة</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-3 text-center">
            <p className="text-2xl font-black text-blue-700">{developers.length}</p>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">مطوّرون</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 p-3 text-center">
            <p className="text-2xl font-black text-purple-700">
              {projects.reduce((max, p) => Math.max(max, Number(p.commission_rate ?? 0)), 0)}%
            </p>
            <p className="text-xs text-purple-600 font-semibold mt-0.5">أعلى عمولة</p>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 text-center">
          <Building2 className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-base font-bold text-gray-500 dark:text-gray-400">لا توجد مشاريع نشطة حالياً</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">سيتم إضافة المشاريع المتاحة قريباً</p>
        </div>
      ) : (
        Object.entries(byDeveloper).map(([developerName, devProjects]) => (
          <div key={developerName} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Developer header */}
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{developerName}</span>
              <span className="text-xs text-gray-400 mr-auto">{devProjects.length} مشروع</span>
            </div>

            {/* Projects list */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {devProjects.map(proj => (
                <div key={proj.id} className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{proj.name}</p>
                    {proj.region && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {proj.region}
                      </p>
                    )}
                    {proj.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{proj.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {proj.commission_rate != null && (
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-black text-sm ${
                        Number(proj.commission_rate) >= 3
                          ? 'bg-emerald-600 text-white'
                          : Number(proj.commission_rate) >= 2
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        <Percent className="w-3.5 h-3.5" />
                        {proj.commission_rate}
                      </div>
                    )}
                    <a
                      href="/broker-portal/sales"
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      ارفع بيعة ←
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Promo CTA */}
      {projects.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 p-5 text-white text-center">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-80" />
          <p className="font-bold">لم تجد ما تبحث عنه؟</p>
          <p className="text-sm text-white/80 mt-1">تواصل مع Account Manager لمعرفة أحدث العروض والمشاريع الحصرية</p>
          <a href="/broker-portal/profile" className="inline-block mt-3 bg-white/20 hover:bg-white/30 transition-colors text-white font-bold text-sm px-5 py-2 rounded-xl">
            تواصل الآن
          </a>
        </div>
      )}
    </div>
  )
}
