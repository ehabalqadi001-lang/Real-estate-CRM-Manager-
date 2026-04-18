import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { FileText, Plus, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ContractsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // Fetch contracted deals as contracts source
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, title, client_name, amount, unit_value, stage, status, created_at, agent_id')
    .in('stage', ['Contracted', 'Registration', 'Handover'])
    .order('created_at', { ascending: false })

  const contracts = deals ?? []
  const total      = contracts.length
  const handover   = contracts.filter(d => d.stage === 'Handover').length
  const registered = contracts.filter(d => d.stage === 'Registration').length
  const contracted = contracts.filter(d => d.stage === 'Contracted').length
  const totalValue = contracts.reduce((s, d) => s + Number(d.unit_value ?? d.amount ?? 0), 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n)

  const STAGE_STYLE: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
    'Contracted':  { label: 'تعاقد',    color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-100',    icon: FileText },
    'Registration':{ label: 'تسجيل',   color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-100',  icon: Clock },
    'Handover':    { label: 'تسليم',    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle },
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00C27C] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">إدارة العقود</h1>
            <p className="text-xs text-[var(--fi-muted)]">{total} عقد نشط</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-[#00C27C] hover:bg-[#009F64] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#00C27C]/20">
          <Plus size={15} /> إضافة عقد جديد
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm font-bold">
          {error.message}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي العقود',  value: total,      icon: FileText,    color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
          { label: 'تعاقد',          value: contracted,  icon: Clock,       color: 'text-[var(--fi-muted)]',   bg: 'bg-[var(--fi-soft)]',   border: 'border-[var(--fi-line)]' },
          { label: 'قيد التسجيل',   value: registered,  icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'تم التسليم',    value: handover,    icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border ${kpi.border} flex items-center gap-3`}>
            <div className={`${kpi.bg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <div>
              <p className="text-xs text-[var(--fi-muted)] font-medium">{kpi.label}</p>
              <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Total value */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-900/20">
        <p className="text-blue-200 text-sm font-semibold mb-1">إجمالي قيمة العقود</p>
        <p className="text-3xl font-black">{fmt(totalValue)}</p>
      </div>

      {/* Contracts table */}
      <div className="bg-[var(--fi-paper)] rounded-2xl shadow-sm border border-[var(--fi-line)] overflow-hidden">
        <div className="p-4 border-b border-[var(--fi-line)] bg-[var(--fi-soft)]/50">
          <h3 className="font-bold text-[var(--fi-ink)] text-sm flex items-center gap-2">
            <FileText size={14} className="text-blue-600" /> سجل العقود
          </h3>
        </div>

        {contracts.length === 0 ? (
          <div className="text-center py-16">
            <XCircle size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-[var(--fi-muted)] font-bold">لا توجد عقود مسجلة</p>
            <p className="text-xs text-[var(--fi-muted)] mt-1">ستظهر هنا الصفقات التي وصلت مرحلة التعاقد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[var(--fi-soft)] border-b border-[var(--fi-line)]">
                <tr>
                  {['العقد', 'العميل', 'المرحلة', 'القيمة', 'التاريخ'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-[var(--fi-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {contracts.map(deal => {
                  const stage = STAGE_STYLE[deal.stage ?? 'Contracted'] ?? STAGE_STYLE['Contracted']
                  const StageIcon = stage.icon
                  return (
                    <tr key={deal.id} className="hover:bg-[var(--fi-soft)] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--fi-ink)]">{deal.title ?? 'عقد'}</p>
                        <p className="text-xs text-[var(--fi-muted)]">{deal.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--fi-muted)]">{deal.client_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${stage.bg} ${stage.color} ${stage.border}`}>
                          <StageIcon size={9} /> {stage.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 text-xs">
                        {fmt(Number(deal.unit_value ?? deal.amount ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--fi-muted)]">
                        {new Date(deal.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
