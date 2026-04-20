'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { downloadSingleCommissionPdf } from './CommissionPdf'
import type { CommissionRow } from './commission-types'

export function CommissionsHistoryClient({ commissions }: { commissions: CommissionRow[] }) {
  const monthly = Array.from(
    commissions.reduce((map, row) => {
      const date = new Date(row.paidAt ?? row.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const label = date.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' })
      const current = map.get(key) ?? { label, amount: 0 }
      current.amount += row.agentAmount
      map.set(key, current)
      return map
    }, new Map<string, { label: string; amount: number }>()).values(),
  ).slice(-12)

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[var(--fi-line)] bg-white p-4">
        <h1 className="text-2xl font-black text-[var(--fi-ink)]">سجل العمولات المدفوعة</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">كل العمولات التي تم صرفها مع الإيصالات والتحميل الفردي.</p>
      </div>

      <div className="rounded-xl border border-[var(--fi-line)] bg-white p-4">
        <h2 className="mb-4 text-sm font-black text-[var(--fi-ink)]">ملخص شهري</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid stroke="var(--fi-line)" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('ar-EG', { notation: 'compact' }).format(Number(value))} />
              <Tooltip formatter={(value) => `${new Intl.NumberFormat('ar-EG').format(Number(value))} ج.م`} />
              <Bar dataKey="amount" fill="var(--fi-emerald)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--fi-line)] bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-[var(--fi-soft)]">
            <tr>
              <th className="p-3">الوسيط</th>
              <th className="p-3">المبلغ</th>
              <th className="p-3">طريقة الدفع</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">إيصال</th>
              <th className="p-3">PDF</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((row) => (
              <tr key={row.id} className="border-t border-[var(--fi-line)]">
                <td className="p-3 font-bold">{row.agentName}</td>
                <td className="p-3 font-black text-[var(--fi-emerald)]">{formatMoney(row.agentAmount)}</td>
                <td className="p-3">{row.paymentMethod ?? 'غير محدد'}</td>
                <td className="p-3">{row.paidAt ? new Date(row.paidAt).toLocaleDateString('ar-EG') : '-'}</td>
                <td className="p-3">{row.receiptUrl ? <a className="text-[var(--fi-emerald)] underline" href={row.receiptUrl}>فتح</a> : '-'}</td>
                <td className="p-3"><Button size="sm" variant="outline" onClick={() => downloadSingleCommissionPdf(row)}>تحميل</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value)} ج.م`
}
