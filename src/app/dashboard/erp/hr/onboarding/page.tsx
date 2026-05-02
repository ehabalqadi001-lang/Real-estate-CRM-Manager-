import { getI18n } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, CheckCircle2, Clock, Users } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { InitOnboardingButton, TaskToggleButton, AddCustomTaskForm } from './OnboardingControls'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

type OnboardingTask = {
  id: string
  employee_id: string
  task_title: string
  task_description: string | null
  category: string
  order_index: number
  is_required: boolean
  due_date: string | null
  completed_at: string | null
  notes: string | null
}

const categoryLabel: Record<string, string> = {
  document:  'وثائق',
  access:    'صلاحيات',
  training:  'تدريب',
  equipment: 'معدات',
  intro:     'تعارف',
  review:    'مراجعة',
  general:   'عام',
}

const categoryColor: Record<string, string> = {
  document:  'bg-blue-50 text-blue-700',
  access:    'bg-violet-50 text-violet-700',
  training:  'bg-emerald-50 text-emerald-700',
  equipment: 'bg-amber-50 text-amber-700',
  intro:     'bg-pink-50 text-pink-700',
  review:    'bg-orange-50 text-orange-700',
  general:   'bg-slate-100 text-slate-600',
}

export default async function OnboardingPage() {
  const { dir } = await getI18n()
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  // Get employees hired in last 90 days (active onboarding window)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  let empQuery = supabase
    .from('employees')
    .select('id, hire_date, job_title, employee_number, profiles!employees_id_fkey(full_name, email)')
    .eq('status', 'active')
    .order('hire_date', { ascending: false })
    .limit(100)
  if (companyId) empQuery = empQuery.eq('company_id', companyId)

  let tasksQuery = supabase
    .from('onboarding_tasks')
    .select('id, employee_id, task_title, task_description, category, order_index, is_required, due_date, completed_at, notes')
    .order('order_index', { ascending: true })
  if (companyId) tasksQuery = tasksQuery.eq('company_id', companyId)

  const [empResult, tasksResult] = await Promise.all([empQuery, tasksQuery])

  type EmpRow = {
    id: string; hire_date: string | null; job_title: string | null; employee_number: string
    profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null
  }
  const allEmployees = ((empResult.data ?? []) as unknown as EmpRow[]).map((e) => ({
    ...e,
    profiles: Array.isArray(e.profiles) ? e.profiles[0] : e.profiles,
  }))

  // Only show recently hired (90 days) + those with active tasks
  const tasks = (tasksResult.data ?? []) as unknown as OnboardingTask[]
  const employeesWithTasks = new Set(tasks.map((t) => t.employee_id))

  const recentEmployees = allEmployees.filter(
    (e) => (e.hire_date && e.hire_date >= ninetyDaysAgo) || employeesWithTasks.has(e.id),
  )

  const canWrite = HR_WRITE_ROLES.includes(profile.role)

  // KPIs
  const totalEmployeesOnboarding = new Set(tasks.map((t) => t.employee_id)).size
  const completedTasks  = tasks.filter((t) => t.completed_at).length
  const pendingTasks    = tasks.filter((t) => !t.completed_at).length
  const overdueTasks    = tasks.filter((t) => !t.completed_at && t.due_date && t.due_date < new Date().toISOString().slice(0, 10)).length

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">ONBOARDING WORKFLOW</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">بروتوكول استقبال الموظفين</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
          قوائم مهام الاستقبال — التوثيق، التدريب، الصلاحيات، التعارف. أول 30 يوم تصنع الفرق.
        </p>
      </section>

      <BentoGrid>
        <BentoKpiCard title="موظفون في الاستقبال" value={<AnimatedCount value={totalEmployeesOnboarding} />} hint="نشط" icon={<Users className="size-5" />} />
        <BentoKpiCard title="مهام مكتملة" value={<AnimatedCount value={completedTasks} />} hint="من إجمالي المهام" icon={<CheckCircle2 className="size-5" />} />
        <BentoKpiCard title="مهام معلقة" value={<AnimatedCount value={pendingTasks} />} hint="بانتظار الإنجاز" icon={<ClipboardList className="size-5" />} />
        <BentoKpiCard title="مهام متأخرة" value={<AnimatedCount value={overdueTasks} />} hint="تجاوزت الموعد" icon={<Clock className="size-5" />} />
      </BentoGrid>

      {/* Per-employee onboarding cards */}
      {recentEmployees.length === 0 ? (
        <section className="ds-card border-2 border-dashed border-[var(--fi-line)] p-10 text-center">
          <ClipboardList className="mx-auto mb-3 size-10 text-[var(--fi-muted)]" />
          <p className="font-black text-[var(--fi-ink)]">لا يوجد موظفون جدد في نطاق الـ 90 يوم</p>
          <p className="mt-1 text-sm font-bold text-[var(--fi-muted)]">
            عند إضافة موظف جديد، استخدم زر "بدء بروتوكول الاستقبال" لإطلاق قائمة المهام تلقائياً.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {recentEmployees.map((emp) => {
            const empTasks = tasks.filter((t) => t.employee_id === emp.id)
            const hasOnboarding = empTasks.length > 0
            const doneCount = empTasks.filter((t) => t.completed_at).length
            const progressPct = empTasks.length > 0 ? Math.round((doneCount / empTasks.length) * 100) : 0

            return (
              <section key={emp.id} className="ds-card overflow-hidden">
                {/* Employee header */}
                <div className="flex flex-col gap-3 border-b border-[var(--fi-line)] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-lg font-black text-emerald-600">
                      {(emp.profiles?.full_name ?? '?')[0]}
                    </div>
                    <div>
                      <Link href={`/dashboard/erp/hr/employees/${emp.id}`} className="font-black text-[var(--fi-ink)] hover:text-[var(--fi-emerald)] transition">
                        {emp.profiles?.full_name ?? 'موظف'}
                      </Link>
                      <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">
                        {emp.job_title ?? 'غير محدد'} — التحق: {emp.hire_date ? new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(emp.hire_date)) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {hasOnboarding && (
                      <div className="flex items-center gap-2">
                        <div className="w-24 overflow-hidden rounded-full bg-[var(--fi-soft)] h-2.5">
                          <div
                            className={`h-full rounded-full transition-all ${progressPct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-[var(--fi-ink)]">{progressPct}%</span>
                        <span className="text-xs font-bold text-[var(--fi-muted)]">({doneCount}/{empTasks.length})</span>
                      </div>
                    )}
                    {canWrite && !hasOnboarding && <InitOnboardingButton employeeId={emp.id} />}
                  </div>
                </div>

                {/* Tasks */}
                {hasOnboarding && (
                  <div>
                    <div className="divide-y divide-[var(--fi-line)]">
                      {empTasks.map((task) => {
                        const isOverdue = !task.completed_at && task.due_date && task.due_date < new Date().toISOString().slice(0, 10)
                        return (
                          <div
                            key={task.id}
                            className={`flex items-start gap-3 px-5 py-3 transition ${task.completed_at ? 'opacity-60' : ''}`}
                          >
                            {canWrite ? (
                              <TaskToggleButton taskId={task.id} completed={Boolean(task.completed_at)} />
                            ) : (
                              <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${task.completed_at ? 'bg-emerald-100 text-emerald-600' : 'border border-[var(--fi-line)] text-[var(--fi-muted)]'}`}>
                                {task.completed_at ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-black ${task.completed_at ? 'line-through text-[var(--fi-muted)]' : 'text-[var(--fi-ink)]'}`}>
                                {task.task_title}
                                {task.is_required && !task.completed_at && (
                                  <span className="mr-2 text-xs font-bold text-red-500">*مطلوب</span>
                                )}
                              </p>
                              {task.task_description && (
                                <p className="mt-0.5 text-xs text-[var(--fi-muted)]">{task.task_description}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${categoryColor[task.category] ?? 'bg-slate-100 text-slate-600'}`}>
                                {categoryLabel[task.category] ?? task.category}
                              </span>
                              {task.due_date && (
                                <span className={`text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-[var(--fi-muted)]'}`}>
                                  {new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short' }).format(new Date(task.due_date))}
                                  {isOverdue && ' ⚠'}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Add custom task */}
                    {canWrite && (
                      <div className="border-t border-[var(--fi-line)] bg-[var(--fi-soft)]/50 px-5 py-4">
                        <p className="text-xs font-black text-[var(--fi-muted)]">إضافة مهمة مخصصة</p>
                        <AddCustomTaskForm employeeId={emp.id} />
                      </div>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
