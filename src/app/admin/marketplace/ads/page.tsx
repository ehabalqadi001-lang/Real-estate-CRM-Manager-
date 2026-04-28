import Link from 'next/link'
import { LayoutGrid, Plus, Star, Pin, EyeOff, TrendingUp } from 'lucide-react'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { AdsManagerTable, type LiveAd } from './AdsManagerTable'

export const dynamic = 'force-dynamic'

export default async function GlobalAdsManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>
}) {
  await requirePermission('admin.view')
  const feedback = await searchParams
  const supabase = createServiceRoleClient()

  const [
    { data: ads },
    { count: featuredCount },
    { count: pinnedCount },
    { count: hiddenCount },
    { count: totalCount },
  ] = await Promise.all([
    supabase
      .from('ads')
      .select('id,title,price,currency,property_type,location,status,images,listing_type,is_featured,is_featured_admin,is_pinned,is_hidden_admin,admin_category,created_at,user_id,rejection_reason,edit_request_notes,reviewed_at')
      .in('status', ['approved', 'pending', 'edit_requested', 'rejected'])
      .order('is_pinned', { ascending: false })
      .order('is_featured_admin', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_featured_admin', true),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_pinned', true),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_hidden_admin', true),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
  ])

  const userIds = [...new Set((ads ?? []).map((ad) => ad.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id,full_name,email').in('id', userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  const enriched: LiveAd[] = (ads ?? []).map((ad) => {
    const profile = profileMap.get(ad.user_id)
    return {
      ...ad,
      images: ad.images as string[] | null,
      seller_name: profile?.full_name ?? null,
      seller_email: profile?.email ?? null,
    }
  })

  const stats = [
    { label: 'Live ads', value: totalCount ?? 0, icon: TrendingUp, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
    { label: 'Featured by admin', value: featuredCount ?? 0, icon: Star, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
    { label: 'Pinned to top', value: pinnedCount ?? 0, icon: Pin, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    { label: 'Hidden by admin', value: hiddenCount ?? 0, icon: EyeOff, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' },
  ]

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-6" dir="ltr">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#17375E] via-[#1D4E89] to-[#0F8F83] p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
              <LayoutGrid className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white/70">Marketplace Admin</p>
              <h1 className="text-2xl font-black">Ads Management</h1>
              <p className="mt-1 text-sm text-white/70">
                Review the active catalog, pin or feature listings, hide weak inventory, and create a new ad from the admin workspace.
              </p>
            </div>
          </div>

          <Link
            href="/admin/marketplace/ads/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-[#17375E] transition hover:bg-[#EEF6F5]"
          >
            <Plus className="size-4" />
            Create New Ad
          </Link>
        </div>
      </div>

      {feedback.created && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          The ad was created and submitted successfully.
        </div>
      )}
      {feedback.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {decodeURIComponent(feedback.error)}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-2xl border ${stat.border} ${stat.bg} p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">{stat.label}</p>
                <p className={`mt-1 text-3xl font-black ${stat.text}`}>{stat.value.toLocaleString('en-US')}</p>
              </div>
              <stat.icon className={`size-8 ${stat.text} opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      <AdsManagerTable ads={enriched} />
    </div>
  )
}
