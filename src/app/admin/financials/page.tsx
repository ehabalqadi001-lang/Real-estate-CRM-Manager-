import { CircleDollarSign } from 'lucide-react'
import { FinancialExportButtons, type AdminFinancialExportRow, type AdminMonthlyRevenueRow } from '@/components/admin/financial-export-buttons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createTypedServerClient } from '@/lib/supabase/typed'
import { requirePermission } from '@/shared/rbac/require-permission'
import { bulkUpdateCommissions } from './actions'

export const dynamic = 'force-dynamic'

function money(value: number) {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value)
}

export default async function AdminFinancialsPage() {
  await requirePermission('admin.view')
  const supabase = await createTypedServerClient()
  const { data: commissions, error } = await supabase.from('commissions').select('*').order('created_at', { ascending: false })
  const rows = commissions ?? []
  const paidRevenue = rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + Number(row.company_amount ?? 0), 0)
  const pending = rows.filter((row) => ['pending', 'processing', 'approved'].includes(row.status ?? ''))
  const monthly = new Map<string, number>()
  rows.forEach((row) => {
    const key = (row.paid_at ?? row.created_at ?? '').slice(0, 7) || 'غير محدد'
    monthly.set(key, (monthly.get(key) ?? 0) + Number(row.company_amount ?? 0))
  })

  const exportRows: AdminFinancialExportRow[] = rows.map((row) => ({
    id: row.id,
    dealId: row.deal_id,
    companyId: row.company_id,
    status: row.status,
    companyAmount: Number(row.company_amount ?? 0),
    grossCommission: Number(row.gross_commission ?? row.amount ?? 0),
    grossDealValue: Number(row.gross_deal_value ?? row.deal_value ?? 0),
    createdAt: row.created_at,
    paidAt: row.paid_at,
  }))
  const monthlyRows: AdminMonthlyRevenueRow[] = Array.from(monthly, ([month, value]) => ({ month, value }))

  return (
    <main className="space-y-5 p-4 sm:p-6" dir="rtl">
      <section className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5">
        <h1 className="text-2xl font-black">ماليات المنصة</h1>
        <p className="text-sm text-[var(--fi-muted)]">إيرادات المنصة وطلبات صرف العمولات.</p>
      </section>
      {error ? <div className="text-destructive">{error.message}</div> : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Kpi label="إيرادات مدفوعة" value={money(paidRevenue)} />
            <Kpi label="طلبات تحت المراجعة" value={pending.length.toLocaleString('ar-EG')} />
            <Kpi label="إجمالي عمولات المنصة" value={money(rows.reduce((sum, row) => sum + Number(row.company_amount ?? 0), 0))} />
          </div>
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 font-black">الإيراد الشهري</h2>
              <div className="grid gap-2 md:grid-cols-4">
                {monthlyRows.map((row) => (
                  <div key={row.month} className="rounded-lg bg-[var(--fi-soft)] p-3">
                    <p className="text-xs text-[var(--fi-muted)]">{row.month}</p>
                    <p className="font-black">{money(row.value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <section className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
            <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="font-black">طلبات صرف بانتظار الإدارة</h2>
              <FinancialExportButtons rows={exportRows} monthly={monthlyRows} />
            </div>
            <form action={bulkUpdateCommissions} className="mb-3 flex gap-2">
              <input type="hidden" name="ids" value={pending.map((row) => row.id).join(',')} />
              <Button name="status" value="approved">اعتماد الكل</Button>
              <Button name="status" value="disputed" variant="destructive">رفض الكل</Button>
            </form>
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-[var(--fi-muted)]">
                <tr><th className="p-2 text-right">الصفقة</th><th className="p-2 text-right">الشركة</th><th className="p-2 text-right">نصيب المنصة</th><th className="p-2 text-right">الحالة</th></tr>
              </thead>
              <tbody>
                {pending.map((row) => <tr key={row.id} className="border-t"><td className="p-2">{row.deal_id}</td><td className="p-2">{row.company_id}</td><td className="p-2">{money(Number(row.company_amount ?? 0))}</td><td className="p-2">{row.status}</td></tr>)}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><CircleDollarSign className="size-8 text-[var(--fi-emerald)]" /><div><p className="text-xs text-[var(--fi-muted)]">{label}</p><p className="font-black">{value}</p></div></CardContent></Card>
}
