import { getI18n } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import { Brain, AlertTriangle, Heart, Trophy, TrendingUp } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { BurnoutForm } from './BurnoutForm'
import { PulseForm } from './PulseForm'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

type BurnoutRow = {
  id: string
  employee_id: string
  period_month: number
  period_year: number
  workload_score: number
  overtime_hours: number
  absence_days: number
  late_check_ins: number
  missed_targets_pct: number
  burnout_score: number
  risk_level: string
  hr_notes: string | null
  profiles: { full_name: string | null; job_title?: string | null } | null
}

type PulseRow = {
  engagement_score: number
  satisfaction_score: number
  nps_score: number
}

type PointsRow = {
  employee_id: string
  total_points: number
  profiles: { full_name: string | null } | null
}

const riskBadge: Record<string, string> = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-emerald-50 text-emerald-700',
}

const riskLabel: Record<string, string> = {
  high: '🔴 عالٍ',
  medium: '🟡 متوسط',
  low: '🟢 منخفض',
}

const formatter = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 1 })

export default async function HRBPPage() {
  const { dir } = await getI18n()
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  let burnoutQuery = supabase
    .from('burnout_indicators')
    .select('id, employee_id, period_month, period_year, workload_score, overtime_hours, absence_days, late_check_ins, missed_targets_pct, burnout_score, risk_level, hr_notes, profiles!burnout_indicators_employee_id_fkey(full_name)')
    .eq('period_year', year)
    .order('burnout_score', { ascending: false })
    .limit(100)

  if (companyId) burnoutQuery = burnoutQuery.eq('company_id', companyId)

  let pulseQuery = supabase
    .from('employee_pulse')
    .select('engagement_score, satisfaction_score, nps_score')
    .gte('submitted_at', `${year}-01-01`)

  if (companyId) pulseQuery = pulseQuery.eq('company_id', companyId)

  let pointsQuery = supabase
    .from('points_ledger')
    .select('employee_id, total_points:points.sum(), profiles!points_ledger_employee_id_fkey(full_name)')
    .limit(20)

  if (companyId) pointsQuery = (pointsQuery as any).eq('company_id', companyId)

  let employeesQuery = supabase
    .from('employees')
    .select('id, job_title, profiles!employees_id_fkey(full_name)')
    .eq('status', 'active')

  if (companyId) employeesQuery = employeesQuery.eq('company_id', companyId)

  const [burnoutResult, pulseResult, employeesResult] = await Promise.all([
    burnoutQuery,
    pulseQuery,
    employeesQuery,
  ])

  const burnoutData = ((burnoutResult.data ?? []) as unknown as BurnoutRow[]).map((b) => ({
    ...b,
    profiles: Array.isArray(b.profiles) ? b.profiles[0] : b.profiles,
  }))

  const pulseData = (pulseResult.data ?? []) as PulseRow[]
  const employees = (employeesResult.data ?? []).map((e: any) => ({
    id: e.id as string,
    name: (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles)?.full_name ?? 'موظف',
    jobTitle: e.job_title as string | null,
  }))

  const canWrite = HR_WRITE_ROLES.includes(profile.role)
  const highRiskCount = burnoutData.filter((b) => b.risk_level === 'high').length
  const avgBurnout = burnoutData.length
    ? burnoutData.reduce((s, b) => s + b.burnout_score, 0) / burnoutData.length
    : 0
  const avgEngagement = pulseData.length
    ? pulseData.reduce((s, p) => s + p.engagement_score, 0) / pulseData.length
    : 0
  const avgNps = pulseData.length
    ? pulseData.reduce((s, p) => s + p.nps_score, 0) / pulseData.length
    : 0

  // Current month data
  const thisMonthBurnout = burnoutData.filter((b) => b.period_month === month)

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">HRBP INTELLIGENCE & CULTURE</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">الذكاء البشري وثقافة الأداء</h1>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          رصد الإجهاد والاحتراق — استطلاع الرضا — مؤشرات الثقافة — لوحة الإنجازات.
        </p>
      </section>

      <BentoGrid>
        <BentoKpiCard
          title="موظفون في خطر مرتفع"
          value={<AnimatedCount value={highRiskCount} />}
          hint="إجهاد عالٍ هذا الشهر"
          icon={<AlertTriangle className="size-5" />}
        />
        <BentoKpiCard
          title="متوسط درجة الإجهاد"
          value={<><AnimatedCount value={Math.round(avgBurnout * 10) / 10} /><span className="text-base">/10</span></>}
          hint="كل الموظفين"
          icon={<Brain className="size-5" />}
        />
        <BentoKpiCard
          title="معدل الانخراط"
          value={<><AnimatedCount value={Math.round(avgEngagement * 10) / 10} /><span className="text-base">/5</span></>}
          hint={`${pulseData.length} استجابة`}
          icon={<Heart className="size-5" />}
        />
        <BentoKpiCard
          title="مؤشر التوصية (NPS)"
          value={<><AnimatedCount value={Math.round(avgNps * 10) / 10} /><span className="text-base">/10</span></>}
          hint="هذا العام"
          icon={<TrendingUp className="size-5" />}
        />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-2">
        {canWrite ? <BurnoutForm employees={employees} /> : (
          <section className="ds-card p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">رصد مؤشرات الإجهاد</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--fi-muted)]">متاح لفريق الموارد البشرية فقط.</p>
          </section>
        )}
        <PulseForm />
      </div>

      {thisMonthBurnout.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">رادار الإجهاد — {month}/{year}</h2>
            <span className="text-sm font-bold text-[var(--fi-muted)]">{thisMonthBurnout.length} موظف</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">الموظف</th>
                  <th className="px-4 py-3 text-right">عبء العمل</th>
                  <th className="px-4 py-3 text-right">ساعات إضافية</th>
                  <th className="px-4 py-3 text-right">أيام غياب</th>
                  <th className="px-4 py-3 text-right">تأخيرات</th>
                  <th className="px-4 py-3 text-right">أهداف فائتة</th>
                  <th className="px-4 py-3 text-right">درجة الإجهاد</th>
                  <th className="px-4 py-3 text-right">مستوى الخطر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {thisMonthBurnout.map((b) => (
                  <tr key={b.id} className={`transition hover:bg-[var(--fi-soft)]/60 ${b.risk_level === 'high' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-black text-[var(--fi-ink)]">{b.profiles?.full_name ?? 'غير محدد'}</p>
                      {b.hr_notes && <p className="mt-0.5 text-xs text-[var(--fi-muted)]">{b.hr_notes}</p>}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{b.workload_score}/10</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{b.overtime_hours}h</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{b.absence_days}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{b.late_check_ins}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{b.missed_targets_pct}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                          <div
                            className={`h-2 rounded-full transition-all ${b.burnout_score >= 7 ? 'bg-red-500' : b.burnout_score >= 4 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                            style={{ width: `${(b.burnout_score / 10) * 100}%` }}
                          />
                        </div>
                        <span className="font-black text-[var(--fi-ink)]">{b.burnout_score}/10</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${riskBadge[b.risk_level] ?? 'bg-slate-100 text-slate-600'}`}>
                        {riskLabel[b.risk_level] ?? b.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {burnoutData.filter((b) => b.risk_level === 'high').length > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div>
              <p className="font-black text-red-800">تنبيه: موظفون في منطقة الخطر المرتفع</p>
              <p className="mt-1 text-sm font-bold text-red-700">
                {burnoutData.filter((b) => b.risk_level === 'high').map((b) => b.profiles?.full_name ?? 'موظف').join(' — ')}
              </p>
              <p className="mt-2 text-xs font-bold text-red-600">
                يُنصح بجلسات متابعة فردية وإعادة توزيع عبء العمل فوراً.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
