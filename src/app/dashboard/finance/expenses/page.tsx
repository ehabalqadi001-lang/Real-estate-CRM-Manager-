/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy page pending migration into domains/finance with typed DTOs. */
import { Receipt, CheckCircle, Clock } from 'lucide-react'
import { getExpenses } from '@/domains/finance/actions'
import AddExpenseButton from './AddExpenseButton'
import ApproveExpenseButton from './ApproveExpenseButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ category?: string; status?: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  rent: 'إيجار', salary: 'رواتب', marketing: 'تسويق',
  utilities: 'خدمات', travel: 'سفر', other: 'أخرى',
}
const STATUS_CFG = {
  pending:  { label: 'قيد الانتظار', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  approved: { label: 'مُعتمد',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  rejected: { label: 'مرفوض',       color: 'text-red-700 bg-red-50 border-red-200' },
}
const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function ExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { expenses, total } = await getExpenses({ category: params.category, status: params.status })

  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0)
  const totalPending  = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
            <Receipt size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">المصروفات</h1>
            <p className="text-xs text-[var(--fi-muted)]">{total} مصروف</p>
          </div>
        </div>
        <AddExpenseButton />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--fi-paper)] rounded-xl p-4 shadow-sm border border-[var(--fi-line)] flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-600" />
          <div>
            <p className="text-xs text-[var(--fi-muted)]">مُعتمدة</p>
            <p className="font-black text-emerald-700">{fmt(totalApproved)} ج.م</p>
          </div>
        </div>
        <div className="bg-[var(--fi-paper)] rounded-xl p-4 shadow-sm border border-[var(--fi-line)] flex items-center gap-3">
          <Clock size={18} className="text-amber-600" />
          <div>
            <p className="text-xs text-[var(--fi-muted)]">قيد الانتظار</p>
            <p className="font-black text-amber-700">{fmt(totalPending)} ج.م</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--fi-paper)] rounded-2xl shadow-sm border border-[var(--fi-line)] overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="font-bold text-[var(--fi-muted)]">لا توجد مصروفات مسجلة</p>
          </div>
        ) : (
          <table className="w-full text-right text-sm" dir="rtl">
            <thead className="bg-[var(--fi-soft)] border-b border-[var(--fi-line)]">
              <tr>
                {['التاريخ','التصنيف','الوصف','المبلغ','الحالة',''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-[var(--fi-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.map((exp: any) => {
                const cfg = STATUS_CFG[exp.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
                return (
                  <tr key={exp.id} className="hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3 text-xs text-[var(--fi-muted)]" dir="ltr">
                      {new Date(exp.expense_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold bg-slate-100 text-[var(--fi-muted)] px-2 py-0.5 rounded-md">
                        {CATEGORY_LABELS[exp.category] ?? exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--fi-ink)] max-w-[200px] truncate">
                      {exp.description}
                    </td>
                    <td className="px-4 py-3 font-black text-red-600">{fmt(exp.amount)} ج.م</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {exp.status === 'pending' && <ApproveExpenseButton expenseId={exp.id} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
