import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Clock, CheckCircle2, XCircle, FileEdit, ShieldAlert } from 'lucide-react'
import { ModerationTable, type PendingAd } from './ModerationTable'

export const dynamic = 'force-dynamic'

export default async function ModerationPage() {
  await requirePermission('ads.read')
  const supabase = await createRawClient()

  const [{ data: ads }, { count: approvedToday }, { count: rejectedToday }, { count: editRequested }] =
    await Promise.all([
      supabase
        .from('ads')
        .select('id,title,price,currency,property_type,location,images,is_urgent,created_at,status,user_id')
        .eq('status', 'pending')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(100),
      supabase.from('ads').select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('reviewed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('ads').select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('reviewed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'edit_requested'),
    ])

  // Enrich with seller profiles
  const userIds = [...new Set((ads ?? []).map((a) => a.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id,full_name,email').in('id', userIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const enriched: PendingAd[] = (ads ?? []).map((ad) => {
    const p = profileMap.get(ad.user_id)
    return {
      ...ad,
      images: ad.images as string[] | null,
      seller_name: p?.full_name ?? null,
      seller_email: p?.email ?? null,
    }
  })

  const stats = [
    { label: 'معلق الآن', value: enriched.length, icon: Clock, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', iconBg: 'bg-amber-100' },
    { label: 'موافق عليها اليوم', value: approvedToday ?? 0, icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    { label: 'مرفوضة اليوم', value: rejectedToday ?? 0, icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', iconBg: 'bg-red-100' },
    { label: 'تنتظر تعديل', value: editRequested ?? 0, icon: FileEdit, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-100' },
  ]

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-l from-amber-600 via-orange-500 to-red-500 p-4 sm:p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white/70">Marketplace CPanel</p>
            <h1 className="text-2xl font-black">مراجعة الإعلانات المعلقة</h1>
            <p className="mt-1 text-sm text-white/70">
              راجع كل إعلان بدقة — وافق أو ارفض أو اطلب تعديلاً بحسب معايير المنصة
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
                <p className={`mt-1 text-xl sm:text-3xl font-black ${s.text}`}>{s.value}</p>
              </div>
              <div className={`flex size-11 items-center justify-center rounded-xl ${s.iconBg}`}>
                <s.icon className={`size-5 ${s.text}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Moderation Table */}
      <ModerationTable ads={enriched} />
    </div>
  )
}
