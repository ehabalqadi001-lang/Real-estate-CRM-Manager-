import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import type { ReactElement } from 'react'
import { Coins, ReceiptText, TrendingUp, WalletCards } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TX_TYPE_AR: Record<string, string> = {
  paymob_topup: 'شحن Paymob',
  manual_grant: 'منحة يدوية',
  manual_deduct: 'خصم يدوي',
  ad_spend: 'إعلان',
}

const TX_TYPE_CLASSES: Record<string, string> = {
  paymob_topup: 'bg-green-100 text-green-700',
  manual_grant: 'bg-blue-100 text-blue-700',
  manual_deduct: 'bg-red-100 text-red-700',
  ad_spend: 'bg-amber-100 text-amber-700',
}

export default async function MarketplaceFinancePage() {
  await requirePermission('admin.view')
  const supabase = await createRawClient()

  const [
    { data: transactions },
    { data: walletStats },
    { count: activeWallets },
  ] = await Promise.all([
    supabase
      .from('wallet_transactions')
      .select('id, type, points_delta, balance_after, money_amount, currency, reason, created_at, user_id, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('wallet_transactions')
      .select('money_amount, points_delta, type')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase
      .from('user_wallets')
      .select('*', { count: 'exact', head: true })
      .gt('points_balance', 0),
  ])

  const monthlyRevenue = (walletStats ?? [])
    .filter((t) => t.type === 'paymob_topup' && t.money_amount)
    .reduce((sum, t) => sum + Number(t.money_amount ?? 0), 0)

  const monthlyPointsSold = (walletStats ?? [])
    .filter((t) => t.type === 'paymob_topup')
    .reduce((sum, t) => sum + Math.abs(Number(t.points_delta ?? 0)), 0)

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-sm font-black text-[#0F8F83]">Finance Team</p>
        <h1 className="mt-2 text-xl sm:text-3xl font-black text-[#102033] dark:text-white">إيرادات الباقات ومحافظ النقاط</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">متابعة المدفوعات، أرصدة النقاط، وتسوية عمليات شراء الباقات.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FinanceCard icon={<TrendingUp />} label="إيراد الشهر" value={`${monthlyRevenue.toLocaleString('ar-EG')} ج.م`} />
        <FinanceCard icon={<Coins />} label="نقاط مباعة هذا الشهر" value={monthlyPointsSold.toLocaleString('ar-EG')} />
        <FinanceCard icon={<WalletCards />} label="محافظ نشطة" value={(activeWallets ?? 0).toLocaleString('ar-EG')} />
      </div>

      <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="mb-4 flex items-center gap-2 font-black">
          <ReceiptText className="size-5 text-[#C9964A]" />
          آخر العمليات (50)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DDE6E4] text-xs font-black text-slate-400">
                <th className="pb-2 text-right">المستخدم</th>
                <th className="pb-2 text-right">النوع</th>
                <th className="pb-2 text-right">النقاط</th>
                <th className="pb-2 text-right">الرصيد بعد</th>
                <th className="pb-2 text-right">المبلغ (ج.م)</th>
                <th className="pb-2 text-right">السبب</th>
                <th className="pb-2 text-right">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE6E4]">
              {(transactions ?? []).map((tx) => {
                const profile = tx.profiles as { email?: string } | null
                return (
                  <tr key={tx.id} className="py-2 text-xs">
                    <td className="py-2 font-medium text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                      {profile?.email ?? tx.user_id.slice(0, 8) + '…'}
                    </td>
                    <td className="py-2">
                      <Badge className={`text-xs ${TX_TYPE_CLASSES[tx.type] ?? 'bg-slate-100 text-slate-600'}`}>
                        {TX_TYPE_AR[tx.type] ?? tx.type}
                      </Badge>
                    </td>
                    <td className={`py-2 font-black ${Number(tx.points_delta) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(tx.points_delta) >= 0 ? '+' : ''}{Number(tx.points_delta).toLocaleString('ar-EG')}
                    </td>
                    <td className="py-2 text-slate-600">{Number(tx.balance_after).toLocaleString('ar-EG')}</td>
                    <td className="py-2 text-slate-600">
                      {tx.money_amount ? Number(tx.money_amount).toLocaleString('ar-EG') : '—'}
                    </td>
                    <td className="py-2 max-w-[200px] truncate text-slate-500">{tx.reason ?? '—'}</td>
                    <td className="py-2 text-slate-400 whitespace-nowrap" dir="ltr">
                      {new Date(tx.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
              {!(transactions?.length) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">لا توجد معاملات بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FinanceCard({ icon, label, value }: { icon: ReactElement; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#DDE6E4] bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="flex items-center gap-2 text-[#0F8F83]">
        {icon}
        <span className="text-sm font-black text-slate-500">{label}</span>
      </div>
      <p className="mt-3 text-xl sm:text-3xl font-black text-[#102033] dark:text-white">{value}</p>
    </div>
  )
}
