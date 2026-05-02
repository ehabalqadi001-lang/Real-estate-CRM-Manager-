import { getI18n } from '@/lib/i18n'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, BadgeDollarSign, ShieldCheck, FileText,
  UserCheck, BookOpen, CalendarCheck2, Building2,
  TrendingUp, ArrowLeft,
} from 'lucide-react'
import { nullableUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

export default async function ERPOverviewPage() {
  const { t, numLocale } = await getI18n()
  const fmt = (n: number) =>
    new Intl.NumberFormat(numLocale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  const fmtFull = (n: number) =>
    new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(n)
  const session = await requireSession()
  const { profile } = session

  const allowedRoles = [
    'super_admin', 'platform_admin', 'company_admin', 'company_owner',
    'hr_manager', 'hr_staff', 'hr_officer',
    'finance_manager', 'finance_officer', 'legal_manager',
  ]
  if (!allowedRoles.includes(profile.role ?? '')) redirect('/dashboard')

  const supabase  = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)
  const now       = new Date()
  const month     = now.getMonth() + 1
  const year      = now.getFullYear()

  const baseEmp = supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'active')
  const empQ    = companyId ? baseEmp.eq('company_id', companyId) : baseEmp

  const basePay = supabase.from('payroll').select('net_salary, total_commissions').eq('month', month).eq('year', year)

  const [
    { count: activeEmployees },
    { data: payrollRows },
    { count: pendingLeaves },
    { count: legalDocs },
    { count: hrContracts },
    { count: journalCount },
    { data: recentJournals },
  ] = await Promise.all([
    empQ,
    basePay,
    (companyId
      ? supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending')
      : supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    (companyId
      ? supabase.from('legal_documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      : supabase.from('legal_documents').select('id', { count: 'exact', head: true })),
    (companyId
      ? supabase.from('hr_contracts').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      : supabase.from('hr_contracts').select('id', { count: 'exact', head: true })),
    (companyId
      ? supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      : supabase.from('journal_entries').select('id', { count: 'exact', head: true })),
    (companyId
      ? supabase.from('journal_entries').select('entry_number, description, total_debit, entry_date, is_posted').eq('company_id', companyId).order('entry_date', { ascending: false }).limit(5)
      : supabase.from('journal_entries').select('entry_number, description, total_debit, entry_date, is_posted').order('entry_date', { ascending: false }).limit(5)),
  ])

  const totalPayroll     = (payrollRows ?? []).reduce((s, p) => s + Number(p.net_salary ?? 0), 0)
  const totalCommissions = (payrollRows ?? []).reduce((s, p) => s + Number(p.total_commissions ?? 0), 0)

  const kpis = [
    { label: t('الموظفون النشطون', 'Active Employees'),  value: String(activeEmployees ?? 0),                               icon: Users,          color: 'bg-emerald-50 text-emerald-600' },
    { label: t('الرواتب هذا الشهر', 'Monthly Payroll'),  value: fmt(totalPayroll) + ' ' + t('ج.م', 'EGP'),                  icon: BadgeDollarSign, color: 'bg-sky-50 text-sky-600' },
    { label: t('العمولات المحتسبة', 'Commissions'),       value: fmt(totalCommissions) + ' ' + t('ج.م', 'EGP'),              icon: TrendingUp,     color: 'bg-amber-50 text-amber-600' },
    { label: t('إجازات معلقة', 'Pending Leaves'),         value: String(pendingLeaves ?? 0),                                 icon: CalendarCheck2,  color: 'bg-orange-50 text-orange-600' },
    { label: t('وثائق قانونية', 'Legal Documents'),       value: String(legalDocs ?? 0),                                    icon: FileText,        color: 'bg-indigo-50 text-indigo-600' },
    { label: t('عقود موظفين', 'Employee Contracts'),      value: String(hrContracts ?? 0),                                  icon: UserCheck,       color: 'bg-violet-50 text-violet-600' },
    { label: t('قيود محاسبية', 'Journal Entries'),        value: String(journalCount ?? 0),                                 icon: BookOpen,        color: 'bg-rose-50 text-rose-600' },
  ]

  const modules = [
    {
      href:      '/dashboard/erp/hr',
      icon:      Users,
      gradient:  'from-emerald-500 to-teal-600',
      title:     t('الموارد البشرية', 'Human Resources'),
      subtitle:  t('موظفون · رواتب · حضور · عمولات · مسارات تعليمية', 'Employees · Payroll · Attendance · Commissions · Learning'),
      stat:      `${activeEmployees ?? 0} ${t('موظف نشط', 'active employees')}`,
    },
    {
      href:      '/dashboard/erp/finance',
      icon:      TrendingUp,
      gradient:  'from-sky-500 to-blue-600',
      title:     t('المحاسبة والمالية', 'Accounting & Finance'),
      subtitle:  t('دفتر أستاذ · ذمم مدينة/دائنة · ميزانية · دليل حسابات', 'General Ledger · AR/AP · Budget · Chart of Accounts'),
      stat:      `${fmt(totalPayroll)} ${t('ج.م', 'EGP')} ${t('رواتب', 'payroll')}`,
    },
    {
      href:      '/dashboard/erp/legal',
      icon:      ShieldCheck,
      gradient:  'from-indigo-500 to-violet-600',
      title:     t('العقود والوثائق القانونية', 'Legal Documents & Contracts'),
      subtitle:  t('وثائق قانونية · عقود موظفين · قوالب · سجل تدقيق', 'Legal Docs · Employee Contracts · Templates · Audit Log'),
      stat:      `${(legalDocs ?? 0) + (hrContracts ?? 0)} ${t('وثيقة وعقد', 'docs & contracts')}`,
    },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">ENTERPRISE RESOURCE PLANNING</p>
              <h1 className="text-2xl font-black text-[var(--fi-ink)]">{t('نظام تخطيط موارد المؤسسة', 'Enterprise Resource Planning')}</h1>
              <p className="text-xs text-[var(--fi-muted)] mt-0.5">
                {t('HR · محاسبة · قانوني — لوحة مركزية موحدة لـ', 'HR · Accounting · Legal — Central dashboard for')} {month}/{year}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex w-fit items-center gap-2 rounded-xl border border-[var(--fi-line)] px-4 py-2 text-sm font-bold text-[var(--fi-muted)] hover:bg-[var(--fi-soft)] transition-colors"
          >
            {t('لوحة CRM', 'CRM Dashboard')} →
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-4">
            <div className={`w-8 h-8 ${kpi.color} rounded-lg flex items-center justify-center mb-2`}>
              <kpi.icon size={15} />
            </div>
            <p className="text-xl font-black text-[var(--fi-ink)] leading-none">{kpi.value}</p>
            <p className="text-xs text-[var(--fi-muted)] mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Module navigation cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {modules.map(mod => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl p-5 hover:shadow-lg transition-all hover:border-indigo-200"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${mod.gradient} rounded-xl flex items-center justify-center mb-4`}>
              <mod.icon size={22} className="text-white" />
            </div>
            <h2 className="font-black text-[var(--fi-ink)] text-lg">{mod.title}</h2>
            <p className="text-xs text-[var(--fi-muted)] mt-1 mb-4 leading-5">{mod.subtitle}</p>
            <div className="flex items-center justify-between border-t border-[var(--fi-line)] pt-3">
              <span className="text-sm font-black text-[var(--fi-emerald)]">{mod.stat}</span>
              <ArrowLeft size={15} className="text-[var(--fi-muted)] transition group-hover:-translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent journal entries feed */}
      {(recentJournals?.length ?? 0) > 0 && (
        <div className="bg-[var(--fi-paper)] border border-[var(--fi-line)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--fi-line)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[var(--fi-muted)]" />
              <h2 className="font-bold text-[var(--fi-ink)]">{t('آخر القيود المحاسبية', 'Recent Journal Entries')}</h2>
            </div>
            <Link href="/dashboard/erp/finance" className="text-xs font-black text-indigo-600 hover:underline">
              {t('عرض الكل', 'View all')} →
            </Link>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {recentJournals?.map((je, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--fi-soft)] transition-colors">
                <div>
                  <p className="font-semibold text-[var(--fi-ink)] text-sm">{je.description}</p>
                  <p className="text-xs text-[var(--fi-muted)]">
                    {je.entry_number} · {je.entry_date ? new Date(je.entry_date).toLocaleDateString(numLocale) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-sm text-[var(--fi-ink)]">
                    {fmtFull(Number(je.total_debit ?? 0))} {t('ج.م', 'EGP')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${je.is_posted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {je.is_posted ? t('مرحَّل', 'Posted') : t('مسودة', 'Draft')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
