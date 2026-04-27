import Link from 'next/link'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Users, Wallet, ShieldBan, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  await requirePermission('admin.view')
  const supabase = await createRawClient()

  const [{ data: clients }, { count: suspendedCount }, { count: totalWallets }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,full_name,email,phone,status,is_active,created_at,role')
      .in('role', ['CLIENT', 'client', 'viewer', 'individual'])
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    supabase.from('user_wallets').select('*', { count: 'exact', head: true }).gt('points_balance', 0),
  ])

  // Bulk fetch wallet balances
  const clientIds = (clients ?? []).map((c) => c.id)
  const { data: wallets } = clientIds.length
    ? await supabase.from('user_wallets').select('user_id,points_balance').in('user_id', clientIds)
    : { data: [] }
  const walletMap = new Map((wallets ?? []).map((w) => [w.user_id, w.points_balance]))

  // Ad counts per client — direct query (no custom RPC dependency)
  const { data: adRows } = clientIds.length
    ? await supabase.from('ads').select('user_id,status').in('user_id', clientIds)
    : { data: [] }
  const adMap = new Map<string, { active: number; pending: number }>()
  for (const ad of adRows ?? []) {
    const cur = adMap.get(ad.user_id) ?? { active: 0, pending: 0 }
    if (ad.status === 'approved') cur.active++
    if (ad.status === 'pending') cur.pending++
    adMap.set(ad.user_id, cur)
  }

  const stats = [
    { label: 'إجمالي العملاء', value: (clients ?? []).length, icon: Users, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    { label: 'محافظ نشطة', value: totalWallets ?? 0, icon: Wallet, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
    { label: 'حسابات موقوفة', value: suspendedCount ?? 0, icon: ShieldBan, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
  ]

  return (
    <div className="min-h-screen space-y-6 bg-[#f8fafc] p-6" dir="rtl">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-l from-cyan-600 via-teal-500 to-emerald-500 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white/70">Marketplace CPanel</p>
            <h1 className="text-2xl font-black">العملاء 360°</h1>
            <p className="mt-1 text-sm text-white/70">عرض كامل لكل عميل — محفظته، إعلاناته، وسجله</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Client Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-4">
          <Search className="size-4 text-slate-400" />
          <p className="font-black text-slate-700">قائمة العملاء</p>
          <span className="mr-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500">
            {(clients ?? []).length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 pr-4 pl-3 text-right">العميل</th>
                <th className="py-3 px-3 text-right">رصيد النقاط</th>
                <th className="py-3 px-3 text-right">إعلانات مباشرة</th>
                <th className="py-3 px-3 text-right">معلقة</th>
                <th className="py-3 px-3 text-right">الحالة</th>
                <th className="py-3 px-3 text-center">عرض 360°</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(clients ?? []).map((client) => {
                const balance = walletMap.get(client.id) ?? 0
                const ads = adMap.get(client.id) ?? { active: 0, pending: 0 }
                const isSuspended = client.status === 'suspended' || client.is_active === false
                return (
                  <tr key={client.id} className={`transition-colors hover:bg-slate-50 ${isSuspended ? 'opacity-60' : ''}`}>
                    <td className="py-3 pr-4 pl-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-xs font-black text-white">
                          {(client.full_name ?? client.email ?? 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[160px] truncate font-bold text-slate-800">{client.full_name ?? '—'}</p>
                          <p className="max-w-[160px] truncate text-xs text-slate-400">{client.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-700">
                      {Number(balance).toLocaleString('ar-EG')} نقطة
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">{ads.active}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">{ads.pending}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-black ${isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isSuspended ? '🔒 موقوف' : '✅ نشط'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Link
                        href={`/admin/marketplace/clients/${client.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-teal-600"
                      >
                        360° عرض
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!(clients?.length) && (
            <div className="py-16 text-center text-sm text-slate-400">لا يوجد عملاء</div>
          )}
        </div>
      </div>
    </div>
  )
}
