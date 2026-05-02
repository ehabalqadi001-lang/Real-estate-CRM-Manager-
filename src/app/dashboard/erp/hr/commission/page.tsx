import { getI18n } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import { BadgeDollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { RecordDealForm } from './RecordDealForm'
import { CommissionApproveButton, CommissionRejectButton, SyncCRMButton } from './CommissionActions'
import { calculateTieredCommission } from './utils'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

type Deal = {
  id: string
  deal_ref: string
  unit_ref: string | null
  client_name: string | null
  sale_value: number
  collected_amount: number
  commission_rate_pct: number | null
  commission_amount: number
  triggered_commission: number
  deal_stage: string
  status: string
  notes: string | null
  created_at: string
  employee_id: string
  profiles: { full_name: string | null } | null
}

const statusBadge: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
}

export default async function CommissionPage() {
  const { t, numLocale } = await getI18n()
  const formatter = new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 })
  const stageLabel: Record<string, string> = {
    reservation: t('حجز', 'Reservation'),
    contract:    t('عقد', 'Contract'),
    handover:    t('تسليم', 'Handover'),
    collection:  t('تحصيل', 'Collection'),
  }
  const statusLabel: Record<string, string> = {
    pending:  t('قيد المراجعة', 'Under Review'),
    approved: t('مُقرَّرة', 'Approved'),
    rejected: t('مرفوضة', 'Rejected'),
  }
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  let dealsQuery = supabase
    .from('commission_deals')
    .select(`
      id, deal_ref, unit_ref, client_name, sale_value, collected_amount,
      commission_rate_pct, commission_amount, triggered_commission,
      deal_stage, status, notes, created_at, employee_id,
      profiles!commission_deals_employee_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (companyId) dealsQuery = dealsQuery.eq('company_id', companyId)

  let employeesQuery = supabase
    .from('employees')
    .select('id, job_title, commission_rate, profiles!employees_id_fkey(full_name)')
    .eq('status', 'active')

  if (companyId) employeesQuery = employeesQuery.eq('company_id', companyId)

  const [dealsResult, employeesResult] = await Promise.all([dealsQuery, employeesQuery])

  const deals = ((dealsResult.data ?? []) as unknown as Deal[]).map((d) => ({
    ...d,
    profiles: Array.isArray(d.profiles) ? d.profiles[0] : d.profiles,
  }))

  const employees = (employeesResult.data ?? []).map((e: any) => ({
    id: e.id as string,
    name: (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles)?.full_name ?? t('موظف', 'Employee'),
    jobTitle: e.job_title as string | null,
    commissionRate: e.commission_rate as number | null,
  }))

  const canWrite = HR_WRITE_ROLES.includes(profile.role)
  const totalCommissions = deals.reduce((s, d) => s + Number(d.commission_amount ?? 0), 0)
  const totalTriggered = deals.reduce((s, d) => s + Number(d.triggered_commission ?? 0), 0)
  const pendingCount = deals.filter((d) => d.status === 'pending').length
  const approvedCount = deals.filter((d) => d.status === 'approved').length

  // Leaderboard by approved commission
  const leaderboard = Object.values(
    deals
      .filter((d) => d.status === 'approved')
      .reduce<Record<string, { name: string; total: number; deals: number }>>((acc, d) => {
        const key = d.employee_id
        if (!acc[key]) acc[key] = { name: d.profiles?.full_name ?? t('موظف', 'Employee'), total: 0, deals: 0 }
        acc[key].total += Number(d.triggered_commission ?? 0)
        acc[key].deals += 1
        return acc
      }, {}),
  ).sort((a, b) => b.total - a.total)

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">COMMISSION & REWARDS ENGINE</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">{t('محرك العمولات والمكافآت', 'Commission & Rewards Engine')}</h1>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          {t('احتساب تلقائي متدرج: 1.5% أول 5 مليون — 2% ما فوق. ربط بالتحصيل. لوحة أداء فورية.', 'Auto tiered calculation: 1.5% first 5M — 2% above. Linked to collection. Live performance board.')}
        </p>
      </section>

      <BentoGrid>
        <BentoKpiCard
          title={t('إجمالي العمولات المحتسبة', 'Total Commissions')}
          value={<><AnimatedCount value={totalCommissions} /> <span className="text-base">{t('ج.م', 'EGP')}</span></>}
          hint={t('كل الصفقات', 'All deals')}
          icon={<BadgeDollarSign className="size-5" />}
        />
        <BentoKpiCard
          title={t('عمولات مُفعَّلة بالتحصيل', 'Collection-Triggered')}
          value={<><AnimatedCount value={totalTriggered} /> <span className="text-base">{t('ج.م', 'EGP')}</span></>}
          hint={t('نسبة للمحصّل', 'Based on collected')}
          icon={<TrendingUp className="size-5" />}
        />
        <BentoKpiCard
          title={t('قيد المراجعة', 'Under Review')}
          value={<AnimatedCount value={pendingCount} />}
          hint={t('صفقات', 'deals')}
          icon={<Clock className="size-5" />}
        />
        <BentoKpiCard
          title={t('صفقات مُقرَّرة', 'Approved Deals')}
          value={<AnimatedCount value={approvedCount} />}
          hint={t('موافق عليها', 'Approved')}
          icon={<CheckCircle2 className="size-5" />}
        />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        {canWrite ? <RecordDealForm employees={employees} /> : (
          <section className="ds-card p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">{t('تسجيل صفقة', 'Record Deal')}</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--fi-muted)]">{t('متاح لمدير الموارد البشرية وفريق HR فقط.', 'Available to HR Manager and HR team only.')}</p>
          </section>
        )}

        <section className="ds-card p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fi-emerald)]">TIER CALCULATOR</p>
          <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">{t('جدول العمولات المتدرجة', 'Tiered Commission Table')}</h2>
          <div className="mt-4 space-y-3">
            {[1_000_000, 3_000_000, 5_000_000, 7_500_000, 10_000_000].map((val) => (
              <div key={val} className="flex items-center justify-between rounded-lg bg-[var(--fi-soft)] px-4 py-2.5">
                <span className="text-sm font-bold text-[var(--fi-muted)]">{formatter.format(val)} {t('ج.م', 'EGP')}</span>
                <span className="text-sm font-black text-emerald-600">
                  {formatter.format(calculateTieredCommission(val))} {t('ج.م', 'EGP')}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-bold text-[var(--fi-muted)]">
            * {t('إذا كان للموظف نسبة مخصصة تُستخدم بدلاً من الجدول المتدرج.', "If the employee has a custom rate, it overrides the tiered table.")}
          </p>
        </section>
      </div>

      {leaderboard.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">{t('لوحة المتصدرين — العمولات المُقرَّرة', 'Leaderboard — Approved Commissions')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">{t('الترتيب', 'Rank')}</th>
                  <th className="px-4 py-3 text-right">{t('الموظف', 'Employee')}</th>
                  <th className="px-4 py-3 text-right">{t('عدد الصفقات', 'Deals')}</th>
                  <th className="px-4 py-3 text-right">{t('إجمالي العمولة', 'Total Commission')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {leaderboard.map((entry, i) => (
                  <tr key={i} className={`transition hover:bg-[var(--fi-soft)]/60 ${i === 0 ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{entry.name}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{entry.deals}</td>
                    <td className="px-4 py-3 font-black text-emerald-600">{formatter.format(entry.total)} {t('ج.م', 'EGP')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="ds-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--fi-line)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-[var(--fi-ink)]">{t('سجل الصفقات', 'Deals Log')}</h2>
            <span className="text-sm font-bold text-[var(--fi-muted)]">{deals.length} {t('صفقة', 'deals')}</span>
          </div>
          {canWrite && <SyncCRMButton />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">{t('رقم الصفقة', 'Deal Ref')}</th>
                <th className="px-4 py-3 text-right">{t('الموظف', 'Employee')}</th>
                <th className="px-4 py-3 text-right">{t('العميل / الوحدة', 'Client / Unit')}</th>
                <th className="px-4 py-3 text-right">{t('قيمة البيع', 'Sale Value')}</th>
                <th className="px-4 py-3 text-right">{t('عمولة محتسبة', 'Calculated')}</th>
                <th className="px-4 py-3 text-right">{t('عمولة مُفعَّلة', 'Triggered')}</th>
                <th className="px-4 py-3 text-right">{t('المرحلة', 'Stage')}</th>
                <th className="px-4 py-3 text-right">{t('الحالة', 'Status')}</th>
                {canWrite && <th className="px-4 py-3 text-right">{t('إجراء', 'Action')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {deals.map((deal) => (
                <tr key={deal.id} className="transition hover:bg-[var(--fi-soft)]/60">
                  <td className="px-4 py-3 font-black text-[var(--fi-ink)]">
                    <p>{deal.deal_ref}</p>
                    {deal.unit_ref && <p className="mt-0.5 text-xs text-[var(--fi-muted)]">{deal.unit_ref}</p>}
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{deal.profiles?.full_name ?? t('غير محدد', 'Unknown')}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{deal.client_name ?? '—'}</td>
                  <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{formatter.format(deal.sale_value)} {t('ج.م', 'EGP')}</td>
                  <td className="px-4 py-3 font-black text-amber-600">{formatter.format(deal.commission_amount)} {t('ج.م', 'EGP')}</td>
                  <td className="px-4 py-3 font-black text-emerald-600">{formatter.format(deal.triggered_commission)} {t('ج.م', 'EGP')}</td>
                  <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{stageLabel[deal.deal_stage] ?? deal.deal_stage}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadge[deal.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {statusLabel[deal.status] ?? deal.status}
                    </span>
                  </td>
                  {canWrite && (
                    <td className="px-4 py-3">
                      {deal.status === 'pending' && (
                        <div className="flex gap-2">
                          <CommissionApproveButton dealId={deal.id} />
                          <CommissionRejectButton dealId={deal.id} />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!deals.length && (
                <tr>
                  <td colSpan={canWrite ? 9 : 8} className="px-4 py-12 text-center text-sm font-bold text-[var(--fi-muted)]">
                    {t('لا توجد صفقات مسجلة بعد. سجّل أول صفقة من النموذج أعلاه.', 'No deals recorded yet. Record the first deal from the form above.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
