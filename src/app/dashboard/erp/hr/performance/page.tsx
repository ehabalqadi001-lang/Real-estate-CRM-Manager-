import { getI18n } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Star, Target, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { CreateReviewCycleForm, ManagerReviewForm, AddGoalForm } from './PerformanceControls'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

type Review = {
  id: string
  employee_id: string
  review_cycle: string
  period_label: string
  period_start: string
  period_end: string
  status: string
  self_score_sales: number | null
  self_score_teamwork: number | null
  self_score_attendance: number | null
  self_score_initiative: number | null
  self_score_knowledge: number | null
  self_notes: string | null
  mgr_score_sales: number | null
  mgr_score_teamwork: number | null
  final_score: number | null
  rating_label: string | null
  promotion_flag: boolean
  salary_increase_pct: number | null
  profiles: { full_name: string | null } | null
  employees: { job_title: string | null } | null
}

type Goal = {
  id: string
  employee_id: string
  review_id: string | null
  title: string
  target_value: number | null
  actual_value: number | null
  unit: string | null
  weight_pct: number
  status: string
  due_date: string | null
}

const cycleLabel: Record<string, string> = {
  annual: 'سنوي', quarterly: 'ربع سنوي', probation: 'تجريبي',
}
const statusBadge: Record<string, string> = {
  draft:          'bg-slate-100 text-slate-600',
  self_submitted: 'bg-amber-50 text-amber-700',
  hr_review:      'bg-blue-50 text-blue-700',
  completed:      'bg-emerald-50 text-emerald-700',
}
const statusLabel: Record<string, string> = {
  draft:          'مسودة',
  self_submitted: 'بانتظار المدير',
  hr_review:      'مراجعة HR',
  completed:      'مكتمل',
}
const ratingColor: Record<string, string> = {
  'ممتاز':        'text-emerald-600',
  'جيد جداً':     'text-teal-600',
  'جيد':          'text-blue-600',
  'مقبول':        'text-amber-600',
  'يحتاج تحسين':  'text-red-600',
}
const goalStatusBadge: Record<string, string> = {
  active:    'bg-blue-50 text-blue-700',
  achieved:  'bg-emerald-50 text-emerald-700',
  missed:    'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

function ScoreBar({ score }: { score: number | null }) {
  if (!score) return <span className="text-[var(--fi-muted)]">—</span>
  const pct = (score / 5) * 100
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 overflow-hidden rounded-full bg-[var(--fi-soft)] h-1.5">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-black text-[var(--fi-ink)]">{score.toFixed(1)}</span>
    </div>
  )
}

export default async function PerformancePage() {
  const { dir } = await getI18n()
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  let reviewsQuery = supabase
    .from('performance_reviews')
    .select(`
      id, employee_id, review_cycle, period_label, period_start, period_end, status,
      self_score_sales, self_score_teamwork, self_score_attendance, self_score_initiative, self_score_knowledge, self_notes,
      mgr_score_sales, mgr_score_teamwork, final_score, rating_label, promotion_flag, salary_increase_pct,
      profiles!performance_reviews_employee_id_fkey(full_name),
      employees!performance_reviews_employee_id_fkey(job_title)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  if (companyId) reviewsQuery = reviewsQuery.eq('company_id', companyId)

  let goalsQuery = supabase
    .from('performance_goals')
    .select('id, employee_id, review_id, title, target_value, actual_value, unit, weight_pct, status, due_date')
    .order('created_at', { ascending: false })
    .limit(200)
  if (companyId) goalsQuery = goalsQuery.eq('company_id', companyId)

  let empQuery = supabase
    .from('employees')
    .select('id, job_title, profiles!employees_id_fkey(full_name)')
    .eq('status', 'active')
  if (companyId) empQuery = empQuery.eq('company_id', companyId)

  const [reviewsResult, goalsResult, empResult] = await Promise.all([reviewsQuery, goalsQuery, empQuery])

  const reviews = ((reviewsResult.data ?? []) as unknown as Review[]).map((r) => ({
    ...r,
    profiles:  Array.isArray(r.profiles)  ? r.profiles[0]  : r.profiles,
    employees: Array.isArray(r.employees) ? r.employees[0] : r.employees,
  }))
  const goals   = (goalsResult.data ?? []) as unknown as Goal[]
  const employees = ((empResult.data ?? []) as unknown as Array<{
    id: string; job_title: string | null
    profiles: { full_name: string | null } | { full_name: string | null }[] | null
  }>).map((e) => ({
    id: e.id,
    name: (Array.isArray(e.profiles) ? e.profiles[0] : e.profiles)?.full_name ?? 'موظف',
    jobTitle: e.job_title,
  }))

  const canWrite       = HR_WRITE_ROLES.includes(profile.role)
  const completedCount = reviews.filter((r) => r.status === 'completed').length
  const pendingMgr     = reviews.filter((r) => r.status === 'self_submitted').length
  const promotionCount = reviews.filter((r) => r.promotion_flag).length
  const avgFinal       = reviews.filter((r) => r.final_score).length > 0
    ? reviews.filter((r) => r.final_score).reduce((s, r) => s + Number(r.final_score), 0) /
      reviews.filter((r) => r.final_score).length
    : 0

  // Group goals per employee
  const goalsByEmployee = goals.reduce<Record<string, Goal[]>>((acc, g) => {
    if (!acc[g.employee_id]) acc[g.employee_id] = []
    acc[g.employee_id].push(g)
    return acc
  }, {})

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">PERFORMANCE MANAGEMENT</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">تقييمات الأداء</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
          دورات تقييم سنوية وربع سنوية — تقييم ذاتي + مدير — أهداف مرتبطة بالنتائج.
        </p>
      </section>

      <BentoGrid>
        <BentoKpiCard title="تقييمات مكتملة"    value={<AnimatedCount value={completedCount} />}   hint={`من ${reviews.length} إجمالي`} icon={<CheckCircle2 className="size-5" />} />
        <BentoKpiCard title="بانتظار مراجعة المدير" value={<AnimatedCount value={pendingMgr} />}  hint="self_submitted"                icon={<Clock className="size-5" />} />
        <BentoKpiCard title="مرشحون للترقية"    value={<AnimatedCount value={promotionCount} />}    hint="هذه الدورة"                    icon={<TrendingUp className="size-5" />} />
        <BentoKpiCard title="متوسط الأداء"       value={<span>{avgFinal > 0 ? avgFinal.toFixed(2) : '—'}</span>} hint="من 5"          icon={<Star className="size-5" />} />
        <BentoKpiCard title="الأهداف النشطة"    value={<AnimatedCount value={goals.filter((g) => g.status === 'active').length} />} hint="active" icon={<Target className="size-5" />} />
        <BentoKpiCard title="أهداف محققة"       value={<AnimatedCount value={goals.filter((g) => g.status === 'achieved').length} />} hint="achieved" icon={<CheckCircle2 className="size-5" />} />
      </BentoGrid>

      {canWrite && <CreateReviewCycleForm employees={employees} />}

      {/* Pending manager reviews — highlighted */}
      {pendingMgr > 0 && (
        <section className="ds-card overflow-hidden border-2 border-amber-200">
          <div className="border-b border-amber-200 bg-amber-50 p-5">
            <h2 className="text-xl font-black text-amber-800">بانتظار تقييم المدير ({pendingMgr})</h2>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {reviews.filter((r) => r.status === 'self_submitted').map((r) => (
              <div key={r.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link href={`/dashboard/erp/hr/employees/${r.employee_id}`} className="font-black text-[var(--fi-ink)] hover:text-[var(--fi-emerald)] transition">
                      {r.profiles?.full_name ?? '—'}
                    </Link>
                    <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">
                      {r.employees?.job_title ?? '—'} — {cycleLabel[r.review_cycle] ?? r.review_cycle} — {r.period_label}
                    </p>
                    {r.self_notes && (
                      <p className="mt-2 text-xs text-[var(--fi-muted)] italic">"{r.self_notes}"</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3">
                      {[
                        { label: 'مبيعات',  v: r.self_score_sales },
                        { label: 'فريق',    v: r.self_score_teamwork },
                        { label: 'حضور',   v: r.self_score_attendance },
                        { label: 'مبادرة', v: r.self_score_initiative },
                        { label: 'معرفة',  v: r.self_score_knowledge },
                      ].map(({ label, v }) => (
                        <div key={label} className="text-xs">
                          <span className="font-bold text-[var(--fi-muted)]">{label}: </span>
                          <ScoreBar score={v} />
                        </div>
                      ))}
                    </div>
                  </div>
                  {canWrite && <ManagerReviewForm reviewId={r.id} employeeName={r.profiles?.full_name ?? '—'} />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All reviews table */}
      <section className="ds-card overflow-hidden">
        <div className="border-b border-[var(--fi-line)] p-5">
          <h2 className="text-xl font-black text-[var(--fi-ink)]">سجل التقييمات</h2>
          <p className="mt-1 text-sm font-bold text-[var(--fi-muted)]">{reviews.length} تقييم</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                <th className="px-4 py-3 text-right">الموظف</th>
                <th className="px-4 py-3 text-right">الفترة</th>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">التقييم الذاتي</th>
                <th className="px-4 py-3 text-right">تقييم المدير</th>
                <th className="px-4 py-3 text-right">النتيجة</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                {canWrite && <th className="px-4 py-3 text-right">إجراء</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fi-line)]">
              {reviews.map((r) => {
                const selfAvg = r.self_score_sales
                  ? ((r.self_score_sales ?? 0) + (r.self_score_teamwork ?? 0) + (r.self_score_attendance ?? 0) +
                     (r.self_score_initiative ?? 0) + (r.self_score_knowledge ?? 0)) / 5
                  : null
                return (
                  <tr key={r.id} className="transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/erp/hr/employees/${r.employee_id}`} className="font-black text-[var(--fi-ink)] hover:text-[var(--fi-emerald)] transition">
                        {r.profiles?.full_name ?? '—'}
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--fi-muted)]">{r.employees?.job_title ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{r.period_label}</td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{cycleLabel[r.review_cycle] ?? r.review_cycle}</td>
                    <td className="px-4 py-3"><ScoreBar score={selfAvg} /></td>
                    <td className="px-4 py-3"><ScoreBar score={r.final_score} /></td>
                    <td className="px-4 py-3">
                      {r.rating_label ? (
                        <span className={`text-sm font-black ${ratingColor[r.rating_label] ?? 'text-[var(--fi-ink)]'}`}>
                          {r.rating_label}
                          {r.promotion_flag && <span className="mr-1 text-xs text-violet-600">↑ ترقية</span>}
                        </span>
                      ) : <span className="text-[var(--fi-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadge[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        {r.status === 'self_submitted' && (
                          <ManagerReviewForm reviewId={r.id} employeeName={r.profiles?.full_name ?? '—'} />
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
              {!reviews.length && (
                <tr>
                  <td colSpan={canWrite ? 8 : 7} className="px-4 py-12 text-center text-sm font-bold text-[var(--fi-muted)]">
                    لا توجد دورات تقييم بعد. استخدم "إنشاء دورة تقييم جديدة" للبدء.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Goals per employee */}
      {employees.filter((e) => (goalsByEmployee[e.id] ?? []).length > 0 || canWrite).length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">أهداف الموظفين</h2>
            <p className="mt-1 text-sm font-bold text-[var(--fi-muted)]">{goals.length} هدف إجمالي</p>
          </div>
          <div className="divide-y divide-[var(--fi-line)]">
            {employees.map((emp) => {
              const empGoals = goalsByEmployee[emp.id] ?? []
              if (!empGoals.length && !canWrite) return null
              const achievedCount = empGoals.filter((g) => g.status === 'achieved').length
              return (
                <div key={emp.id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-[var(--fi-ink)]">{emp.name}</p>
                      <p className="text-xs font-bold text-[var(--fi-muted)]">{emp.jobTitle ?? '—'} · {achievedCount}/{empGoals.length} محقق</p>
                    </div>
                    {canWrite && <AddGoalForm employeeId={emp.id} />}
                  </div>
                  {empGoals.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {empGoals.map((g) => {
                        const progress = g.target_value && g.actual_value
                          ? Math.min(100, Math.round((g.actual_value / g.target_value) * 100))
                          : null
                        return (
                          <div key={g.id} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-black text-[var(--fi-ink)]">{g.title}</p>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-black ${goalStatusBadge[g.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                {g.status === 'achieved' ? 'محقق' : g.status === 'missed' ? 'فائت' : g.status === 'cancelled' ? 'ملغى' : 'نشط'}
                              </span>
                            </div>
                            {g.target_value != null && (
                              <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">
                                {g.actual_value ?? 0} / {g.target_value} {g.unit ?? ''}
                              </p>
                            )}
                            {progress !== null && (
                              <div className="mt-2 overflow-hidden rounded-full bg-white h-1.5">
                                <div
                                  className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : progress >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                            {g.due_date && (
                              <p className="mt-1 text-xs text-[var(--fi-muted)]">
                                موعد: {new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short' }).format(new Date(g.due_date))}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
