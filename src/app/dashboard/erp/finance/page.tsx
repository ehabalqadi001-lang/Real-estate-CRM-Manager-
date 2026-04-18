import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { BarChart3, TrendingDown, TrendingUp, BookOpen, AlertCircle, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const fmt = (n: number) =>
  new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

const fmtFull = (n: number) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function ERPFinancePage() {
  const session = await requireSession()
  const { profile } = session

  const allowedRoles = ['super_admin', 'finance_manager', 'finance_officer']
  if (!allowedRoles.includes(profile.role ?? '')) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = profile.company_id

  const [
    { data: journalEntries },
    { data: arItems },
    { data: apItems },
    { data: accounts },
  ] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('id, entry_number, description, total_debit, is_posted, entry_date, created_at')
      .eq('company_id', companyId)
      .order('entry_date', { ascending: false })
      .limit(10),

    supabase
      .from('ar_invoices')
      .select('id, invoice_number, total_amount, paid_amount, due_date, status, developer:developers(name)')
      .eq('company_id', companyId)
      .not('status', 'in', '("paid","cancelled")')
      .order('due_date', { ascending: true })
      .limit(10),

    supabase
      .from('ap_bills')
      .select('id, bill_number, total_amount, paid_amount, due_date, status')
      .eq('company_id', companyId)
      .not('status', 'in', '("paid","cancelled")')
      .order('due_date', { ascending: true })
      .limit(10),

    supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name, account_type, balance')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('account_code'),
  ])

  const totalAR       = arItems?.reduce((s, r) => s + Number(r.total_amount ?? 0) - Number(r.paid_amount ?? 0), 0) ?? 0
  const totalAP       = apItems?.reduce((s, r) => s + Number(r.total_amount ?? 0) - Number(r.paid_amount ?? 0), 0) ?? 0
  const overdueAR     = arItems?.filter(r => r.status === 'overdue').length ?? 0
  const recentEntries = journalEntries?.length ?? 0

  const totalAssets      = accounts?.filter(a => a.account_type === 'asset').reduce((s, a) => s + Number(a.balance ?? 0), 0) ?? 0
  const totalLiabilities = accounts?.filter(a => a.account_type === 'liability').reduce((s, a) => s + Number(a.balance ?? 0), 0) ?? 0
  const equity           = totalAssets - totalLiabilities

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">محاسبة المؤسسة — دفتر الأستاذ</h1>
            <p className="text-xs text-[var(--fi-muted)]">ذمم مدينة · ذمم دائنة · قيود محاسبية · ميزان المراجعة</p>
          </div>
        </div>
        <Link
          href="/dashboard/finance"
          className="flex items-center gap-2 border border-[var(--fi-line)] text-[var(--fi-muted)] px-3 py-2 rounded-xl text-sm font-bold hover:bg-[var(--fi-soft)] transition-colors"
        >
          <ArrowUpRight size={14} /> المركز المالي
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'الذمم المدينة (مستحق)', value: totalAR, icon: TrendingUp, color: 'bg-sky-50 text-sky-600' },
          { label: 'الذمم الدائنة (مستحق)', value: totalAP, icon: TrendingDown, color: 'bg-rose-50 text-rose-600' },
          { label: 'إجمالي الأصول', value: totalAssets, icon: BarChart3, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'حقوق الملكية', value: equity, icon: BookOpen, color: 'bg-violet-50 text-violet-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${kpi.color} rounded-lg flex items-center justify-center`}>
                <kpi.icon size={15} />
              </div>
              <span className="text-xs text-[var(--fi-muted)]">{kpi.label}</span>
            </div>
            <p className="text-2xl font-black text-[var(--fi-ink)]">{fmt(kpi.value)} ج.م</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Accounts Receivable */}
        <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--fi-line)] flex items-center justify-between">
            <h2 className="font-bold text-[var(--fi-ink)]">الذمم المدينة</h2>
            {overdueAR > 0 && (
              <span className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full font-semibold">
                <AlertCircle size={12} /> {overdueAR} متأخر
              </span>
            )}
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {(arItems ?? []).map(r => {
              const dev = Array.isArray(r.developer) ? r.developer[0] : r.developer
              const outstanding = Number(r.total_amount ?? 0) - Number(r.paid_amount ?? 0)
              const isOverdue = r.status === 'overdue' || (r.due_date && r.due_date < today)
              return (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-semibold text-[var(--fi-ink)] text-sm">{r.invoice_number ?? '—'}</p>
                    <p className="text-xs text-[var(--fi-muted)]">{dev?.name ?? '—'} · {r.due_date ? new Date(r.due_date).toLocaleDateString('ar-EG') : '—'}</p>
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm ${isOverdue ? 'text-rose-600' : 'text-[var(--fi-ink)]'}`}>
                      {fmtFull(outstanding)} ج.م
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                      {isOverdue ? 'متأخر' : 'مفتوح'}
                    </span>
                  </div>
                </div>
              )
            })}
            {!arItems?.length && (
              <p className="p-6 text-center text-sm text-[var(--fi-muted)]">لا توجد ذمم مدينة مفتوحة</p>
            )}
          </div>
        </div>

        {/* Accounts Payable */}
        <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--fi-line)]">
            <h2 className="font-bold text-[var(--fi-ink)]">الذمم الدائنة</h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {(apItems ?? []).map(r => {
              const outstanding = Number(r.total_amount ?? 0) - Number(r.paid_amount ?? 0)
              const isOverdue = r.status === 'overdue' || (r.due_date && r.due_date < today)
              return (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-semibold text-[var(--fi-ink)] text-sm">{r.bill_number ?? '—'}</p>
                    <p className="text-xs text-[var(--fi-muted)]">{r.due_date ? new Date(r.due_date).toLocaleDateString('ar-EG') : '—'}</p>
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm ${isOverdue ? 'text-rose-600' : 'text-[var(--fi-ink)]'}`}>
                      {fmtFull(outstanding)} ج.م
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isOverdue ? 'متأخر' : 'مفتوح'}
                    </span>
                  </div>
                </div>
              )
            })}
            {!apItems?.length && (
              <p className="p-6 text-center text-sm text-[var(--fi-muted)]">لا توجد ذمم دائنة مفتوحة</p>
            )}
          </div>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--fi-line)]">
          <h2 className="font-bold text-[var(--fi-ink)]">آخر القيود المحاسبية ({recentEntries})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-[var(--fi-muted)] text-xs">
                <th className="text-right px-4 py-3">رقم القيد</th>
                <th className="text-right px-4 py-3">البيان</th>
                <th className="text-right px-4 py-3">المبلغ</th>
                <th className="text-right px-4 py-3">التاريخ</th>
                <th className="text-right px-4 py-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {(journalEntries ?? []).map(je => (
                <tr key={je.id} className="hover:bg-[var(--fi-soft)] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--fi-muted)]">{je.entry_number}</td>
                  <td className="px-4 py-3 text-[var(--fi-ink)]">{je.description}</td>
                  <td className="px-4 py-3 font-bold">{fmtFull(Number(je.total_debit ?? 0))} ج.م</td>
                  <td className="px-4 py-3 text-[var(--fi-muted)] text-xs">
                    {je.entry_date ? new Date(je.entry_date).toLocaleDateString('ar-EG') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${je.is_posted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {je.is_posted ? 'مرحَّل' : 'مسودة'}
                    </span>
                  </td>
                </tr>
              ))}
              {!journalEntries?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--fi-muted)]">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-40" />
                    لا توجد قيود محاسبية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart of Accounts summary */}
      {(accounts?.length ?? 0) > 0 && (
        <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--fi-line)]">
            <h2 className="font-bold text-[var(--fi-ink)]">دليل الحسابات</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-[var(--fi-muted)] text-xs">
                  <th className="text-right px-4 py-3">كود</th>
                  <th className="text-right px-4 py-3">اسم الحساب</th>
                  <th className="text-right px-4 py-3">النوع</th>
                  <th className="text-right px-4 py-3">الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {(accounts ?? []).map(acc => (
                  <tr key={acc.id} className="hover:bg-[var(--fi-soft)]">
                    <td className="px-4 py-2 font-mono text-xs text-[var(--fi-muted)]">{acc.account_code}</td>
                    <td className="px-4 py-2 text-[var(--fi-ink)]">{acc.account_name}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        acc.account_type === 'asset' ? 'bg-sky-100 text-sky-700' :
                        acc.account_type === 'liability' ? 'bg-rose-100 text-rose-700' :
                        acc.account_type === 'equity' ? 'bg-violet-100 text-violet-700' :
                        acc.account_type === 'revenue' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {acc.account_type === 'asset' ? 'أصل' :
                         acc.account_type === 'liability' ? 'التزام' :
                         acc.account_type === 'equity' ? 'حقوق ملكية' :
                         acc.account_type === 'revenue' ? 'إيراد' : 'مصروف'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold text-[var(--fi-ink)]">
                      {fmtFull(Number(acc.balance ?? 0))} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
