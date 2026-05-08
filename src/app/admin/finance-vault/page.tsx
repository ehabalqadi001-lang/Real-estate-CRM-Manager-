import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldAlert, TrendingUp, Wallet, ReceiptText, Download, Clock, CheckCircle2, XCircle, Users } from 'lucide-react'
import { PayoutConfirmDialog } from './PayoutConfirmDialog'
import { SetApprovalPinForm } from './SetApprovalPinForm'

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
    paid:      'bg-[var(--fi-soft)] text-[var(--fi-emerald)]',
    pending:   'bg-[#C9964A]/10 text-[#C9964A]',
    approved:  'bg-blue-100 text-blue-700',
    rejected:  'bg-red-100 text-red-600',
    collected: 'bg-[var(--fi-soft)] text-[var(--fi-emerald)]',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-black" style={{ color: '#C9964A' }}>
            <ShieldAlert className="size-4" /> Finance Vault — محمي
          </p>
          <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">خزينة التمويل</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            إصدار العمولات يتطلب تأكيدًا ثنائي الخطوة.
          </p>
        </div>
        <Button variant="outline" className="font-semibold">
          <Download className="size-4" /> تصدير التقرير
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinKpi icon={<TrendingUp />} label="إجمالي المدفوع"   value={`${totalPaid.toLocaleString('ar-EG')} ج.م`}         color="teal" />
        <FinKpi icon={<Clock />}     label="معلق للمراجعة"    value={`${totalPending.toLocaleString('ar-EG')} ج.م`}       color="gold" badge={pendingCount > 0 ? String(pendingCount) : undefined} />
        <FinKpi icon={<Wallet />}    label="إجمالي العمولات"  value={`${totalCommissions.toLocaleString('ar-EG')} ج.م`}   color="slate" />
        <FinKpi icon={<Users />}     label="عمولات معلقة"     value={`${pendingComm.toLocaleString('ar-EG')} ج.م`}        color="gold" />
      </div>

      {/* Pending Payouts */}
      {pendingCount > 0 && (
        <div className="rounded-xl border-2 p-5" style={{ borderColor: '#C9964A66', backgroundColor: '#C9964A0D' }}>
          <p className="mb-3 flex items-center gap-2 font-black" style={{ color: '#C9964A' }}>
            <ShieldAlert className="size-5" /> دفعات بانتظار الموافقة ({pendingCount})
          </p>
          <div className="space-y-2">
            {transactions.filter((t) => t.status === 'pending').map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-[var(--fi-paper)] px-4 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-black text-[var(--fi-ink)]">{t.description ?? t.type ?? 'عملية مالية'}</p>
                  <p className="text-xs font-semibold text-[var(--fi-muted)]">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black" style={{ color: '#C9964A' }}>{Number(t.amount ?? 0).toLocaleString('ar-EG')} ج.م</span>
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
      <div className="overflow-hidden rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm">
        <div className="flex items-center gap-2 border-b border-[var(--fi-line)] px-5 py-4">
          <Wallet className="size-4" style={{ color: '#C9964A' }} />
          <p className="font-black text-[var(--fi-ink)]">سجل العمولات</p>
          <Badge className="bg-[#C9964A]/10 text-[#C9964A]">{commissions.length}</Badge>
        </div>
        {commissions.length === 0 ? (
          <div className="p-10 text-center"><p className="font-semibold text-[var(--fi-muted)]">لا توجد عمولات بعد</p></div>
        ) : (
          <div className="divide-y divide-[var(--fi-line)]">
            {commissions.map((c) => (
              <div key={c.id} className="grid items-center gap-2 px-5 py-4 text-sm md:grid-cols-[1fr_140px_140px_100px_auto]">
                <div>
                  <p className="font-black text-[var(--fi-ink)]">{c.beneficiary_name ?? 'وكيل'}</p>
                  <p className="text-xs text-[var(--fi-muted)]">{c.commission_type ?? 'عمولة'} · {c.expected_date ?? '—'}</p>
                </div>
                <span className="font-black" style={{ color: '#C9964A' }}>{Number(c.total_amount ?? c.amount ?? 0).toLocaleString('ar-EG')} ج.م</span>
                <Badge className={`w-fit text-xs ${STATUS_BADGE[c.status ?? ''] ?? 'bg-[var(--fi-soft)] text-[var(--fi-muted)]'}`}>{c.status ?? '—'}</Badge>
                <span className="text-xs text-[var(--fi-muted)]">{c.created_at ? new Date(c.created_at).toLocaleDateString('ar-EG') : '—'}</span>
                <div className="flex gap-1.5">
                  {c.status === 'pending' ? (
                    <PayoutConfirmDialog
                      payoutId={c.id}
                      recipientName={c.beneficiary_name ?? 'وكيل'}
                      amount={`${Number(c.total_amount ?? c.amount ?? 0).toLocaleString('ar-EG')} ج.م`}
                    />
                  ) : c.status === 'collected' || c.status === 'paid' ? (
                    <CheckCircle2 className="size-4 text-[var(--fi-emerald)]" />
                  ) : (
                    <XCircle className="size-4 text-[var(--fi-line)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions Ledger */}
      <div className="overflow-hidden rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] shadow-sm">
        <div className="flex items-center gap-2 border-b border-[var(--fi-line)] px-5 py-4">
          <ReceiptText className="size-4 text-[var(--fi-emerald)]" />
          <p className="font-black text-[var(--fi-ink)]">سجل المعاملات</p>
        </div>
        {transactions.length === 0 ? (
          <div className="p-10 text-center"><p className="font-semibold text-[var(--fi-muted)]">لا توجد معاملات بعد</p></div>
        ) : (
          <div className="divide-y divide-[var(--fi-line)]">
            {transactions.map((t) => (
              <div key={t.id} className="grid items-center gap-2 px-5 py-4 text-sm md:grid-cols-[1fr_120px_140px_120px_auto]">
                <div>
                  <p className="font-black text-[var(--fi-ink)]">{t.description ?? t.type ?? 'عملية مالية'}</p>
                  <p className="text-xs text-[var(--fi-muted)]">{t.id.slice(0, 8)}… · {t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : '—'}</p>
                </div>
                <Badge className="w-fit capitalize text-xs">{t.type ?? '—'}</Badge>
                <span className="font-black text-[var(--fi-ink)]">{Number(t.amount ?? 0).toLocaleString('ar-EG')} ج.م</span>
                <Badge className={`w-fit text-xs ${STATUS_BADGE[t.status ?? ''] ?? 'bg-[var(--fi-soft)] text-[var(--fi-muted)]'}`}>{t.status ?? '—'}</Badge>
                <div>
                  {t.status === 'pending' ? (
                    <PayoutConfirmDialog payoutId={t.id} recipientName={t.user_id?.slice(0, 8) ?? 'مستخدم'} amount={`${Number(t.amount ?? 0).toLocaleString('ar-EG')} ج.م`} />
                  ) : t.status === 'paid' ? (
                    <CheckCircle2 className="size-4 text-[var(--fi-emerald)]" />
                  ) : (
                    <XCircle className="size-4 text-[var(--fi-line)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval PIN Setup */}
      <div className="max-w-sm">
        <SetApprovalPinForm />
      </div>
    </div>
  )
}

function FinKpi({ icon, label, value, color, badge }: { icon: React.ReactNode; label: string; value: string; color: 'teal' | 'gold' | 'slate'; badge?: string }) {
  const textColor = { teal: 'text-[var(--fi-emerald)]', gold: 'text-[#C9964A]', slate: 'text-[var(--fi-muted)]' }
  return (
    <div className="relative rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
      {badge && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#C9964A] text-xs font-black text-white">{badge}</span>}
      <div className={`mb-2 ${textColor[color]}`}>{icon}</div>
      <p className="text-3xl font-black text-[var(--fi-ink)]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}
