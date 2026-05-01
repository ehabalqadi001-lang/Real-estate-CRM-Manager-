import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import {
  FileText, ShieldCheck, Clock, AlertCircle,
  CheckCircle2, XCircle, UserCheck,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { CreateLegalDocumentForm, CreateHRContractForm, DocStatusButton } from './LegalForms'

export const dynamic = 'force-dynamic'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:    { label: 'مسودة',        color: 'bg-slate-100 text-slate-600' },
  pending:  { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'معتمد',        color: 'bg-emerald-100 text-emerald-700' },
  sent:     { label: 'مُرسَل',       color: 'bg-sky-100 text-sky-700' },
  signed:   { label: 'موقَّع',       color: 'bg-violet-100 text-violet-700' },
  void:     { label: 'ملغي',         color: 'bg-rose-100 text-rose-700' },
  expired:  { label: 'منتهي',        color: 'bg-slate-100 text-slate-500' },
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  employment: 'عقد توظيف',
  nda:        'اتفاقية سرية',
  freelance:  'عقد مستقل',
  internship: 'تدريب',
  amendment:  'تعديل عقد',
}

const CONTRACT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:      { label: 'مسودة',  color: 'bg-slate-100 text-slate-600' },
  active:     { label: 'ساري',   color: 'bg-emerald-100 text-emerald-700' },
  expired:    { label: 'منتهي', color: 'bg-slate-100 text-slate-500' },
  terminated: { label: 'مُنهى', color: 'bg-rose-100 text-rose-700' },
}

export default async function ERPLegalPage() {
  const session = await requireSession()
  const { profile } = session

  const allowedRoles = [
    'super_admin', 'platform_admin', 'legal_manager',
    'company_admin', 'company_owner', 'hr_manager', 'hr_staff',
  ]
  if (!allowedRoles.includes(profile.role ?? '')) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = profile.company_id

  const [
    { data: documents },
    { data: auditLogs },
    { data: templates },
    { data: employeesRaw },
    { data: hrContracts },
  ] = await Promise.all([
    supabase
      .from('legal_documents')
      .select('id, title, document_type, status, created_at, generated_by, deal_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('legal_audit_logs')
      .select('id, action, actor_name, actor_role, details, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(15),

    supabase
      .from('legal_templates')
      .select('id, name, template_type, is_active')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name'),

    supabase
      .from('employees')
      .select('id, profiles!employees_id_fkey(full_name)')
      .eq('company_id', companyId)
      .limit(200),

    supabase
      .from('hr_contracts')
      .select('id, title, contract_type, contract_number, start_date, end_date, is_permanent, status, employee_id, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const employees = (employeesRaw ?? []).map((e: any) => ({
    id: e.id as string,
    name: (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles)?.full_name ?? 'موظف',
  }))
  const empNameMap: Record<string, string> = Object.fromEntries(
    employees.map(e => [e.id, e.name]),
  )

  const byStatus = (documents ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1
    return acc
  }, {})
  const signed          = byStatus['signed'] ?? 0
  const pendingCount    = (byStatus['pending'] ?? 0) + (byStatus['draft'] ?? 0)
  const voided          = byStatus['void'] ?? 0
  const total           = documents?.length ?? 0
  const contractsTotal  = hrContracts?.length ?? 0

  const todayStr = new Date().toISOString().slice(0, 10)
  const in30     = new Date(); in30.setDate(in30.getDate() + 30)
  const in30Str  = in30.toISOString().slice(0, 10)
  const expiringContracts = (hrContracts ?? []).filter(
    c => !c.is_permanent && c.end_date && c.end_date >= todayStr && c.end_date <= in30Str,
  )

  return (
    <div className="p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--fi-paper)] p-5 rounded-2xl shadow-sm border border-[var(--fi-line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--fi-ink)]">إدارة العقود والوثائق القانونية</h1>
            <p className="text-xs text-[var(--fi-muted)]">العقود · القوالب · سجل التدقيق القانوني</p>
          </div>
        </div>
      </div>

      {/* Expiry alerts */}
      {expiringContracts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <p className="font-black text-amber-800 text-sm">
              {expiringContracts.length} عقد ينتهي خلال 30 يوماً — يرجى المراجعة والتجديد
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringContracts.map(c => (
              <span key={c.id} className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                {c.contract_number} · {empNameMap[c.employee_id] ?? '—'} ·{' '}
                {new Date(c.end_date).toLocaleDateString('ar-EG')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'إجمالي الوثائق',  value: total,          icon: FileText,    color: 'bg-indigo-50 text-indigo-600' },
          { label: 'موقَّعة',          value: signed,         icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'قيد الإنجاز',      value: pendingCount,   icon: Clock,        color: 'bg-amber-50 text-amber-600' },
          { label: 'ملغاة',            value: voided,         icon: XCircle,      color: 'bg-rose-50 text-rose-600' },
          { label: 'عقود الموظفين',    value: contractsTotal, icon: UserCheck,    color: 'bg-violet-50 text-violet-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${kpi.color} rounded-lg flex items-center justify-center`}>
                <kpi.icon size={15} />
              </div>
              <span className="text-xs text-[var(--fi-muted)]">{kpi.label}</span>
            </div>
            <p className="text-3xl font-black text-[var(--fi-ink)]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Create forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CreateLegalDocumentForm />
        <CreateHRContractForm employees={employees} />
      </div>

      {/* HR Contracts table */}
      <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--fi-line)] flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <UserCheck size={15} />
          </div>
          <h2 className="font-bold text-[var(--fi-ink)]">عقود الموظفين ({contractsTotal})</h2>
        </div>
        <div className="overflow-x-auto">
          {hrContracts?.length ? (
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">رقم العقد</th>
                  <th className="px-4 py-3 text-right">الموظف</th>
                  <th className="px-4 py-3 text-right">العنوان</th>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">تاريخ البدء</th>
                  <th className="px-4 py-3 text-right">الانتهاء</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {hrContracts.map(c => {
                  const cst = CONTRACT_STATUS_MAP[c.status] ?? { label: c.status, color: 'bg-slate-100 text-slate-600' }
                  const isExpiring = !c.is_permanent && c.end_date && c.end_date >= todayStr && c.end_date <= in30Str
                  return (
                    <tr key={c.id} className={`transition-colors hover:bg-[var(--fi-soft)] ${isExpiring ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{c.contract_number}</td>
                      <td className="px-4 py-3 font-semibold text-[var(--fi-ink)]">{empNameMap[c.employee_id] ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--fi-muted)] max-w-[200px] truncate">{c.title}</td>
                      <td className="px-4 py-3 text-[var(--fi-muted)]">{CONTRACT_TYPE_LABELS[c.contract_type] ?? c.contract_type}</td>
                      <td className="px-4 py-3 text-[var(--fi-muted)]">{new Date(c.start_date).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-3">
                        {c.is_permanent
                          ? <span className="text-xs font-bold text-emerald-600">دائم</span>
                          : c.end_date
                            ? <span className={`text-xs font-bold ${isExpiring ? 'text-amber-600 font-black' : 'text-[var(--fi-muted)]'}`}>
                                {new Date(c.end_date).toLocaleDateString('ar-EG')}{isExpiring && ' ⚠'}
                              </span>
                            : '—'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cst.color}`}>{cst.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-[var(--fi-muted)]">
              <UserCheck size={24} className="mx-auto mb-2 opacity-40" />
              لا توجد عقود موظفين بعد
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Document pipeline */}
        <div className="lg:col-span-2 bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--fi-line)]">
            <h2 className="font-bold text-[var(--fi-ink)]">خط أنابيب الوثائق</h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {(documents ?? []).map(doc => {
              const st = STATUS_MAP[doc.status] ?? { label: doc.status, color: 'bg-slate-100 text-slate-600' }
              return (
                <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--fi-soft)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <FileText size={14} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--fi-ink)] text-sm">{doc.title}</p>
                      <p className="text-xs text-[var(--fi-muted)]">
                        {doc.document_type} · {new Date(doc.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                    <DocStatusButton docId={doc.id} currentStatus={doc.status} />
                  </div>
                </div>
              )
            })}
            {!documents?.length && (
              <div className="p-8 text-center text-[var(--fi-muted)]">
                <AlertCircle size={24} className="mx-auto mb-2 opacity-40" />
                لا توجد وثائق قانونية
              </div>
            )}
          </div>
        </div>

        {/* Templates + Audit */}
        <div className="space-y-4">
          <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--fi-line)]">
              <h2 className="font-bold text-[var(--fi-ink)] text-sm">القوالب النشطة ({templates?.length ?? 0})</h2>
            </div>
            <div className="divide-y divide-[var(--fi-line)]">
              {(templates ?? []).map(t => (
                <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--fi-ink)]">{t.name}</p>
                    <p className="text-xs text-[var(--fi-muted)]">{t.template_type}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              ))}
              {!templates?.length && (
                <p className="p-4 text-center text-sm text-[var(--fi-muted)]">لا توجد قوالب</p>
              )}
            </div>
          </div>

          <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--fi-line)]">
              <h2 className="font-bold text-[var(--fi-ink)] text-sm">سجل التدقيق القانوني</h2>
            </div>
            <div className="divide-y divide-[var(--fi-line)] max-h-64 overflow-y-auto">
              {(auditLogs ?? []).map(log => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-[var(--fi-ink)]">{log.actor_name ?? '—'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      log.action === 'created' ? 'bg-emerald-100 text-emerald-700' :
                      log.action === 'signed'  ? 'bg-violet-100 text-violet-700' :
                      log.action === 'voided'  ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{log.action}</span>
                  </div>
                  <p className="text-xs text-[var(--fi-muted)]">
                    {log.actor_role} · {new Date(log.created_at).toLocaleString('ar-EG')}
                  </p>
                </div>
              ))}
              {!auditLogs?.length && (
                <p className="p-4 text-center text-sm text-[var(--fi-muted)]">لا يوجد سجل تدقيق</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
