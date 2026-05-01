import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { CreateAccountForm } from './CreateAccountForm'

export const dynamic = 'force-dynamic'

const TYPE_CONFIG: Record<string, { label: string; badge: string; order: number }> = {
  asset:     { label: 'الأصول',        badge: 'bg-sky-50 text-sky-700 border border-sky-200',         order: 1 },
  liability: { label: 'الالتزامات',    badge: 'bg-rose-50 text-rose-700 border border-rose-200',       order: 2 },
  equity:    { label: 'حقوق الملكية',  badge: 'bg-violet-50 text-violet-700 border border-violet-200', order: 3 },
  revenue:   { label: 'الإيرادات',     badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', order: 4 },
  expense:   { label: 'المصروفات',     badge: 'bg-amber-50 text-amber-700 border border-amber-200',    order: 5 },
}

const fmtFull = (n: number) =>
  new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

export default async function ChartOfAccountsPage() {
  const session = await requireSession()
  const { profile } = session

  const allowedRoles = [
    'super_admin', 'platform_admin', 'finance_manager', 'finance_officer',
    'company_admin', 'company_owner',
  ]
  if (!allowedRoles.includes(profile.role ?? '')) redirect('/dashboard')

  const supabase  = await createRawClient()
  const companyId = profile.company_id

  const { data: accountsRaw } = await supabase
    .from('chart_of_accounts')
    .select('id, account_code, account_name, account_type, balance, parent_id, is_active, description')
    .eq('company_id', companyId)
    .order('account_code')

  const accounts = accountsRaw ?? []

  const grouped = accounts.reduce<Record<string, typeof accounts>>((acc, a) => {
    const t = a.account_type ?? 'other'
    if (!acc[t]) acc[t] = []
    acc[t].push(a)
    return acc
  }, {})

  const typeTotals: Record<string, number> = {}
  for (const [type, accs] of Object.entries(grouped)) {
    typeTotals[type] = accs.reduce((s, a) => s + Number(a.balance ?? 0), 0)
  }

  const sortedTypes = Object.keys(grouped).sort(
    (a, b) => (TYPE_CONFIG[a]?.order ?? 99) - (TYPE_CONFIG[b]?.order ?? 99),
  )

  const totalAssets      = typeTotals['asset'] ?? 0
  const totalLiabilities = typeTotals['liability'] ?? 0
  const totalEquity      = typeTotals['equity'] ?? 0
  const equity           = totalAssets - totalLiabilities

  return (
    <div className="p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">دليل الحسابات</h1>
            <p className="text-xs text-[var(--fi-muted)]">
              {accounts.length} حساب · شجرة الحسابات المحاسبية
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/erp/finance"
          className="flex items-center gap-2 rounded-xl border border-[var(--fi-line)] px-3 py-2 text-sm font-bold text-[var(--fi-muted)] hover:bg-[var(--fi-soft)] transition-colors"
        >
          <ArrowRight size={14} /> دفتر الأستاذ
        </Link>
      </div>

      {/* Balance summary */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الأصول',     value: totalAssets,      color: 'bg-sky-50 text-sky-700' },
            { label: 'إجمالي الالتزامات', value: totalLiabilities, color: 'bg-rose-50 text-rose-700' },
            { label: 'حقوق الملكية',      value: totalEquity,      color: 'bg-violet-50 text-violet-700' },
            { label: 'صافي المركز المالي', value: equity,           color: equity >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700' },
          ].map(card => (
            <div key={card.label} className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-4">
              <p className="text-xs text-[var(--fi-muted)] mb-1">{card.label}</p>
              <p className={`text-xl font-black ${card.color.split(' ')[1]}`}>
                {fmtFull(card.value)} ج.م
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Accounts tree */}
        <div className="lg:col-span-2 space-y-4">
          {sortedTypes.map(type => {
            const cfg  = TYPE_CONFIG[type] ?? { label: type, badge: 'bg-slate-100 text-slate-600 border border-slate-200', order: 99 }
            const accs = grouped[type]
            const tot  = typeTotals[type] ?? 0
            return (
              <div key={type} className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[var(--fi-line)]">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg px-3 py-1 text-xs font-black ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs font-bold text-[var(--fi-muted)]">{accs.length} حساب</span>
                  </div>
                  <span className="font-black text-[var(--fi-ink)]">{fmtFull(tot)} ج.م</span>
                </div>
                <div className="divide-y divide-[var(--fi-line)]">
                  {accs.map(acc => (
                    <div
                      key={acc.id}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-[var(--fi-soft)] transition-colors ${!acc.is_active ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {acc.parent_id && (
                          <span className="inline-block w-3 h-3 border-r-2 border-b-2 border-[var(--fi-line)] rounded-br shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-[var(--fi-ink)]">{acc.account_name}</p>
                          {acc.description && (
                            <p className="text-xs text-[var(--fi-muted)]">{acc.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-mono text-xs text-[var(--fi-muted)] bg-[var(--fi-soft)] px-2 py-1 rounded">
                          {acc.account_code}
                        </span>
                        <span className="font-black text-sm text-[var(--fi-ink)] w-28 text-left">
                          {fmtFull(Number(acc.balance ?? 0))} ج.م
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {!accounts.length && (
            <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-14 text-center">
              <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-[var(--fi-ink)]">لا توجد حسابات بعد</p>
              <p className="text-sm text-[var(--fi-muted)] mt-1">
                أضف الحسابات من النموذج لبدء دليل الحسابات
              </p>
            </div>
          )}
        </div>

        {/* Create account form */}
        <div>
          <CreateAccountForm
            parentAccounts={accounts.map(a => ({
              id:           a.id,
              account_code: a.account_code,
              account_name: a.account_name,
              account_type: a.account_type,
            }))}
          />
        </div>
      </div>
    </div>
  )
}
