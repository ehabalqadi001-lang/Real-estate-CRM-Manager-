import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldAlert, TrendingUp, Wallet, ReceiptText, Download, Clock, CheckCircle2, XCircle, Users } from 'lucide-react'
import { PayoutConfirmDialog } from './PayoutConfirmDialog'

export const dynamic = 'force-dynamic'

export default async function FinanceVaultPage() {
  await requirePermission('finance.view')
  const supabase = await createRawClient()

  const [{ data: txs }, { data: comms }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, user_id, amount, status, type, created_at, description')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('commissions')
      .select('id, agent_id, total_amount, amount, status, commission_type, beneficiary_name, expected_date, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const transactions = txs ?? []
  const commissions  = comms ?? []

  const totalPaid    = transactions.filter((t) => t.status === 'paid').reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const totalPending = transactions.filter((t) => t.status === 'pending').reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const pendingCount = transactions.filter((t) => t.status === 'pending').length

  const totalCommissions = commissions.reduce((s, c) => s + Number(c.total_amount ?? c.amount ?? 0), 0)
  const pendingComm      = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.total_amount ?? c.amount ?? 0), 0)

  const STATUS_BADGE: Record<string, string> = {
    paid:      'bg-[#EEF6F5] text-[#0F8F83]',
    pending:   'bg-[#C9964A]/10 text-[#C9964A]',
    approved:  'bg-blue-100 text-blue-700',
    rejected:  'bg-red-100 text-red-600',
    collected: 'bg-[#EEF6F5] text-[#0F8F83]',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-black text-[#C9964A]">
            <ShieldAlert className="size-4" /> Finance Vault — محمي
          </p>
          <h1 className="mt-1 text-3xl font-black text-[#102033] dark:text-white">خزينة التمويل</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            إصدار العمولات يتطلب تأكيدًا ثنائي الخطوة.
          </p>
        </div>
        <Button variant="outline" className="border-[#DDE6E4]">
          <Download className="size-4" /> تصدير التقرير
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinKpi icon={<TrendingUp />} label="إجمالي المدفوع" value={`${totalPaid.toLocaleString('ar-EG')} ج.م`} color="teal" />
        <FinKpi icon={<Clock />}     label="معلق للمراجعة" value={`${totalPending.toLocaleString('ar-EG')} ج.م`} color="gold" badge={pendingCount > 0 ? String(pendingCount) : undefined} />
        <FinKpi icon={<Wallet />}    label="إجمالي العمولات" value={`${totalCommissions.toLocaleString('ar-EG')} ج.م`} color="slate" />
        <FinKpi icon={<Users />}     label="عمولات معلقة" value={`${pendingComm.toLocaleString('ar-EG')} ج.م`} color="gold" />
      </div>

      {/* Pending Payouts */}
      {pendingCount > 0 && (
        <div className="rounded-xl border-2 border-[#C9964A]/40 bg-[#C9964A]/5 p-5">
          <p className="mb-3 flex items-center gap-2 font-black text-[#C9964A]">
            <ShieldAlert className="size-5" /> دفعات بانتظار الموافقة ({pendingCount})
          </p>
          <div className="space-y-2">
            {transactions.filter((t) => t.status === 'pending').map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
                <div>
                  <p className="text-sm font-black text-[#102033] dark:text-white">{t.description ?? t.type ?? 'عملية مالية'}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-[#C9964A]">{Number(t.amount ?? 0).toLocaleString('ar-EG')} ج.م</span>
                  <PayoutConfirmDialog
                    payoutId={t.id}
                    recipientName={t.user_id?.slice(0, 8) ?? 'مستخدم'}
                    amount={`${Number(t.amount ?? 0).toLocaleString('ar-EG')} ج.م`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commissions Table */}
      <div className="overflow-hidden rounded-xl border border-[#DDE6E4] bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-[#DDE6E4] px-5 py-4">
          <Wallet className="size-4 text-[#C9964A]" />
          <p className="font-black text-[#102033] dark:text-white">سجل العمولات</p>
          <Badge className="bg-[#C9964A]/10 text-[#C9964A]">{commissions.length}</Badge>
        </div>
        {commissions.length === 0 ? (
          <div className="p-10 text-center"><p className="font-semibold text-slate-400">لا توجد عمولات بعد</p></div>
        ) : (
          <div className="divide-y divide-[#DDE6E4]">
            {commissions.map((c) => (
              <div key={c.id} className="grid items-center gap-2 px-5 py-4 text-sm md:grid-cols-[1fr_140px_140px_100px_auto]">
                <div>
                  <p className="font-black text-[#102033] dark:text-white">{c.beneficiary_name ?? 'وكيل'}</p>
                  <p className="text-xs text-slate-400">{c.commission_type ?? 'عمولة'} · {c.expected_date ?? '—'}</p>
                </div>
                <span className="font-black text-[#C9964A]">{Number(c.total_amount ?? c.amount ?? 0).toLocaleString('ar-EG')} ج.م</span>
                <Badge className={`w-fit text-xs ${STATUS_BADGE[c.status ?? ''] ?? 'bg-slate-100 text-slate-500'}`}>{c.status ?? '—'}</Badge>
                <span className="text-xs text-slate-400">{c.created_at ? new Date(c.created_at).toLocaleDateString('ar-EG') : '—'}</span>
                <div className="flex gap-1.5">
                  {c.status === 'pending' ? (
                    <PayoutConfirmDialog
                      payoutId={c.id}
                      recipientName={c.beneficiary_name ?? 'وكيل'}
                      amount={`${Number(c.total_amount ?? c.amount ?? 0).toLocaleString('ar-EG')} ج.م`}
                    />
                  ) : c.status === 'collected' || c.status === 'paid' ? (
                    <CheckCircle2 className="size-4 text-[#0F8F83]" />
                  ) : (
                    <XCircle className="size-4 text-slate-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions Ledger */}
      <div className="overflow-hidden rounded-xl border border-[#DDE6E4] bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-[#DDE6E4] px-5 py-4">
          <ReceiptText className="size-4 text-[#0F8F83]" />
          <p className="font-black text-[#102033] dark:text-white">سجل المعاملات</p>
        </div>
        {transactions.length === 0 ? (
          <div className="p-10 text-center"><p className="font-semibold text-slate-400">لا توجد معاملات بعد</p></div>
        ) : (
          <div className="divide-y divide-[#DDE6E4]">
            {transactions.map((t) => (
              <div key={t.id} className="grid items-center gap-2 px-5 py-4 text-sm md:grid-cols-[1fr_120px_140px_120px_auto]">
                <div>
                  <p className="font-black text-[#102033] dark:text-white">{t.description ?? t.type ?? 'عملية مالية'}</p>
                  <p className="text-xs text-slate-400">{t.id.slice(0, 8)}… · {t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : '—'}</p>
                </div>
                <Badge className="w-fit capitalize text-xs">{t.type ?? '—'}</Badge>
                <span className="font-black text-[#102033] dark:text-white">{Number(t.amount ?? 0).toLocaleString('ar-EG')} ج.م</span>
                <Badge className={`w-fit text-xs ${STATUS_BADGE[t.status ?? ''] ?? 'bg-slate-100 text-slate-500'}`}>{t.status ?? '—'}</Badge>
                <div>
                  {t.status === 'pending' ? (
                    <PayoutConfirmDialog payoutId={t.id} recipientName={t.user_id?.slice(0, 8) ?? 'مستخدم'} amount={`${Number(t.amount ?? 0).toLocaleString('ar-EG')} ج.م`} />
                  ) : t.status === 'paid' ? (
                    <CheckCircle2 className="size-4 text-[#0F8F83]" />
                  ) : (
                    <XCircle className="size-4 text-slate-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FinKpi({ icon, label, value, color, badge }: { icon: React.ReactNode; label: string; value: string; color: 'teal' | 'gold' | 'slate'; badge?: string }) {
  const colors = { teal: 'text-[#0F8F83]', gold: 'text-[#C9964A]', slate: 'text-slate-500' }
  return (
    <div className="relative rounded-xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
      {badge && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#C9964A] text-xs font-black text-white">{badge}</span>}
      <div className={`mb-2 ${colors[color]}`}>{icon}</div>
      <p className="text-3xl font-black text-[#102033] dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  )
}
