import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { LayoutGrid, Star, Pin, EyeOff, TrendingUp } from 'lucide-react'
import { AdsManagerTable, type LiveAd } from './AdsManagerTable'

export const dynamic = 'force-dynamic'

export default async function GlobalAdsManagerPage() {
  await requirePermission('admin.view')
  const supabase = await createRawClient()

  const [
    { data: ads },
    { count: featuredCount },
    { count: pinnedCount },
    { count: hiddenCount },
    { count: totalCount },
  ] = await Promise.all([
    supabase
      .from('ads')
      .select('id,title,price,currency,property_type,location,status,images,listing_type,is_featured,is_featured_admin,is_pinned,is_hidden_admin,admin_category,created_at,user_id')
      .in('status', ['approved', 'pending', 'edit_requested'])
      .order('is_pinned', { ascending: false })
      .order('is_featured_admin', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_featured_admin', true),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_pinned', true),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_hidden_admin', true),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
  ])

  const userIds = [...new Set((ads ?? []).map((a) => a.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id,full_name,email').in('id', userIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const enriched: LiveAd[] = (ads ?? []).map((ad) => {
    const p = profileMap.get(ad.user_id)
    return {
      ...ad,
      images: ad.images as string[] | null,
      seller_name: p?.full_name ?? null,
      seller_email: p?.email ?? null,
    }
  })

  const stats = [
    { label: 'إعلانات مباشرة', value: totalCount ?? 0, icon: TrendingUp, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
    { label: 'مميزة (Admin)', value: featuredCount ?? 0, icon: Star, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
    { label: 'مثبتة في الأعلى', value: pinnedCount ?? 0, icon: Pin, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    { label: 'مخفية', value: hiddenCount ?? 0, icon: EyeOff, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' },
  ]

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-6" dir="rtl">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-l from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
            <LayoutGrid className="size-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white/70">Marketplace CPanel</p>
            <h1 className="text-2xl font-black">إدارة جميع الإعلانات</h1>
            <p className="mt-1 text-sm text-white/70">
              تحكم في تمييز، تثبيت، أو إخفاء أي إعلان من هنا مباشرةً
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">{s.label}</p>
                <p className={`mt-1 text-3xl font-black ${s.text}`}>{s.value.toLocaleString('ar-EG')}</p>
              </div>
              <s.icon className={`size-8 ${s.text} opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      {/* Global ads table */}
      <AdsManagerTable ads={enriched} />
    </div>
  )
}
