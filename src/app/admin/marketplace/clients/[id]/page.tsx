import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { ArrowRight, Wallet, ShoppingBag, Clock, Coins, ShieldBan, ShieldCheck } from 'lucide-react'
import { Client360Actions } from './Client360Actions'

export const dynamic = 'force-dynamic'

const TX_TYPE_LABELS: Record<string, string> = {
  paymob_topup: 'شحن Paymob',
  manual_grant: 'منحة يدوية',
  manual_deduct: 'خصم يدوي',
  ad_spend: 'إعلان',
}

const TX_TYPE_CLASSES: Record<string, string> = {
  paymob_topup: 'bg-emerald-100 text-emerald-700',
  manual_grant: 'bg-blue-100 text-blue-700',
  manual_deduct: 'bg-red-100 text-red-700',
  ad_spend: 'bg-amber-100 text-amber-700',
}

export default async function Client360Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('admin.view')
  const { id } = await params
  const supabase = await createRawClient()

  const [
    { data: profile },
    { data: wallet },
    { data: transactions },
    { data: activeAds },
    { data: pendingAds },
    { data: rejectedAds },
  ] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,phone,region,role,status,is_active,created_at').eq('id', id).maybeSingle(),
    supabase.from('user_wallets').select('points_balance,lifetime_points_earned,lifetime_points_spent').eq('user_id', id).maybeSingle(),
    supabase.from('wallet_transactions')
      .select('id,type,points_delta,balance_after,money_amount,currency,reason,created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('ads').select('id,title,price,currency,status,listing_type,created_at,is_featured_admin,is_pinned').eq('user_id', id).eq('status', 'approved').order('created_at', { ascending: false }),
    supabase.from('ads').select('id,title,price,currency,status,created_at').eq('user_id', id).eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('ads').select('id,title,status,rejection_reason,reviewed_at').eq('user_id', id).in('status', ['rejected', 'edit_requested']).order('reviewed_at', { ascending: false }).limit(10),
  ])

  if (!profile) notFound()

  const isSuspended = profile.status === 'suspended' || profile.is_active === false
  const initials = (profile.full_name ?? profile.email ?? 'C').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-4 sm:p-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/marketplace/clients" className="flex items-center gap-1 hover:text-teal-600">
          <ArrowRight className="size-3.5" />
          العملاء
        </Link>
        <span>/</span>
        <span className="font-bold text-slate-700">{profile.full_name ?? profile.email ?? 'عميل'}</span>
      </div>

      {/* Profile Hero */}
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${isSuspended ? 'bg-gradient-to-l from-slate-700 via-slate-600 to-slate-500' : 'bg-gradient-to-l from-teal-600 via-emerald-500 to-green-500'}`}>
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black">{profile.full_name ?? profile.email ?? '—'}</h1>
              {isSuspended ? (
                <span className="rounded-full bg-red-500/30 px-2 py-0.5 text-xs font-black">🔒 موقوف</span>
              ) : (
                <span className="rounded-full bg-emerald-400/30 px-2 py-0.5 text-xs font-black">✅ نشط</span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-white/70" dir="ltr">{profile.email}</p>
            <p className="mt-0.5 text-xs text-white/50">ID: {profile.id}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-white/50">انضم في</p>
            <p className="text-sm font-bold">{new Date(profile.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        {/* Client 360 Actions */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/20 pt-5">
          <Client360Actions clientId={profile.id} isSuspended={isSuspended} />
        </div>
      </div>

      {/* Wallet + Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">رصيد النقاط</p>
              <p className="mt-1 text-xl sm:text-3xl font-black text-emerald-700">{Number(wallet?.points_balance ?? 0).toLocaleString('ar-EG')}</p>
            </div>
            <Wallet className="size-8 text-emerald-300" />
          </div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">نقاط مكتسبة</p>
              <p className="mt-1 text-xl sm:text-3xl font-black text-blue-700">{Number(wallet?.lifetime_points_earned ?? 0).toLocaleString('ar-EG')}</p>
            </div>
            <Coins className="size-8 text-blue-300" />
          </div>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">إعلانات مباشرة</p>
              <p className="mt-1 text-xl sm:text-3xl font-black text-purple-700">{(activeAds ?? []).length}</p>
            </div>
            <ShoppingBag className="size-8 text-purple-300" />
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">إعلانات معلقة</p>
              <p className="mt-1 text-xl sm:text-3xl font-black text-amber-700">{(pendingAds ?? []).length}</p>
            </div>
            <Clock className="size-8 text-amber-300" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Ads */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <ShieldCheck className="size-4 text-emerald-500" />
            <h2 className="font-black text-slate-700">الإعلانات المباشرة</h2>
            <span className="mr-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">{(activeAds ?? []).length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {(activeAds ?? []).slice(0, 6).map((ad) => (
              <div key={ad.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="max-w-[200px] truncate text-sm font-bold text-slate-800">{ad.title}</p>
                  <p className="text-xs text-slate-400">{Number(ad.price).toLocaleString('ar-EG')} {ad.currency ?? 'EGP'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {ad.is_pinned && <span className="text-xs">📌</span>}
                  {ad.is_featured_admin && <span className="text-xs">⭐</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${ad.listing_type === 'PREMIUM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'}`}>
                    {ad.listing_type ?? 'REGULAR'}
                  </span>
                </div>
              </div>
            ))}
            {!(activeAds?.length) && <p className="px-4 py-8 text-center text-xs text-slate-400">لا توجد إعلانات مباشرة</p>}
          </div>
        </section>

        {/* Transaction History */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Coins className="size-4 text-blue-500" />
            <h2 className="font-black text-slate-700">سجل المعاملات</h2>
            <span className="mr-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-black text-blue-700">{(transactions ?? []).length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {(transactions ?? []).slice(0, 8).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${TX_TYPE_CLASSES[tx.type] ?? 'bg-slate-100 text-slate-600'}`}>
                    {TX_TYPE_LABELS[tx.type] ?? tx.type}
                  </span>
                  <span className="max-w-[120px] truncate text-xs text-slate-500">{tx.reason ?? '—'}</span>
                </div>
                <span className={`text-sm font-black ${Number(tx.points_delta) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {Number(tx.points_delta) >= 0 ? '+' : ''}{Number(tx.points_delta).toLocaleString('ar-EG')}
                </span>
              </div>
            ))}
            {!(transactions?.length) && <p className="px-4 py-8 text-center text-xs text-slate-400">لا توجد معاملات</p>}
          </div>
        </section>
      </div>

      {/* Rejected / Edit-Requested Ads */}
      {(rejectedAds ?? []).length > 0 && (
        <section className="rounded-2xl border border-red-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <ShieldBan className="size-4 text-red-500" />
            <h2 className="font-black text-slate-700">الإعلانات المرفوضة / المطلوب تعديلها</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {(rejectedAds ?? []).map((ad) => (
              <div key={ad.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800">{ad.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${ad.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {ad.status === 'rejected' ? 'مرفوض' : 'طلب تعديل'}
                  </span>
                </div>
                {ad.rejection_reason && (
                  <p className="mt-1 text-xs text-slate-500">السبب: {ad.rejection_reason}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
