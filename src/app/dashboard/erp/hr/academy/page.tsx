import { redirect } from 'next/navigation'
import { GraduationCap, BookOpen, Users, CheckCircle2, TrendingUp } from 'lucide-react'
import { createRawClient } from '@/lib/supabase/server'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { nullableUuid } from '@/lib/uuid'
import { BentoGrid, BentoKpiCard } from '@/components/dashboard/BentoDashboardLayout'
import { AnimatedCount } from '@/components/design-system/animated-count'
import { CreateCourseForm } from './CreateCourseForm'

export const dynamic = 'force-dynamic'

const HR_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']
const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

type Course = {
  id: string
  title: string
  description: string | null
  target_role: string | null
  category: string
  duration_hours: number
  content_url: string | null
  is_mandatory: boolean
  status: string
  created_at: string
}

type Enrollment = {
  id: string
  course_id: string
  employee_id: string
  status: string
  score: number | null
  enrolled_at: string
  completed_at: string | null
  profiles: { full_name: string | null } | null
}

type SkillAssessment = {
  id: string
  employee_id: string
  skill_name: string
  current_level: number
  target_level: number
  gap: number
  category: string
  profiles: { full_name: string | null } | null
}

const categoryLabel: Record<string, string> = {
  sales_skills: 'مهارات المبيعات',
  real_estate: 'المعرفة العقارية',
  negotiation: 'التفاوض',
  customer_service: 'خدمة العملاء',
  leadership: 'القيادة',
  compliance: 'الامتثال',
  technology: 'الأدوات التقنية',
  soft_skills: 'مهارات شخصية',
}

const skillCategoryLabel: Record<string, string> = {
  sales: 'المبيعات',
  communication: 'التواصل',
  negotiation: 'التفاوض',
  market_knowledge: 'معرفة السوق',
  technology: 'التقنية',
  leadership: 'القيادة',
}

const formatter = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })

export default async function AcademyPage() {
  const session = await requireSession()
  const { profile } = session
  if (!HR_ROLES.includes(profile.role)) redirect('/dashboard')

  const supabase = await createRawClient()
  const companyId = nullableUuid(profile.company_id) ?? nullableUuid(profile.tenant_id)

  let coursesQuery = supabase
    .from('learning_courses')
    .select('id, title, description, target_role, category, duration_hours, content_url, is_mandatory, status, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (companyId) coursesQuery = coursesQuery.eq('company_id', companyId)

  let enrollmentsQuery = supabase
    .from('course_enrollments')
    .select('id, course_id, employee_id, status, score, enrolled_at, completed_at, profiles!course_enrollments_employee_id_fkey(full_name)')
    .order('enrolled_at', { ascending: false })
    .limit(200)

  let skillsQuery = supabase
    .from('skill_assessments')
    .select('id, employee_id, skill_name, current_level, target_level, gap, category, profiles!skill_assessments_employee_id_fkey(full_name)')
    .order('gap', { ascending: false })
    .limit(100)

  const [coursesResult, enrollmentsResult, skillsResult] = await Promise.all([
    coursesQuery,
    enrollmentsQuery,
    skillsQuery,
  ])

  const courses = (coursesResult.data ?? []) as Course[]
  const enrollments = ((enrollmentsResult.data ?? []) as unknown as Enrollment[]).map((e) => ({
    ...e,
    profiles: Array.isArray(e.profiles) ? e.profiles[0] : e.profiles,
  }))
  const skills = ((skillsResult.data ?? []) as unknown as SkillAssessment[]).map((s) => ({
    ...s,
    profiles: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles,
  }))

  const canWrite = HR_WRITE_ROLES.includes(profile.role)
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed').length
  const avgScore = enrollments.filter((e) => e.score != null).length
    ? enrollments.filter((e) => e.score != null).reduce((s, e) => s + (e.score ?? 0), 0) / enrollments.filter((e) => e.score != null).length
    : 0
  const highGapSkills = skills.filter((s) => s.gap >= 3)

  // Completion rate per course
  const enrollmentsByCourse = enrollments.reduce<Record<string, { total: number; completed: number }>>((acc, e) => {
    if (!acc[e.course_id]) acc[e.course_id] = { total: 0, completed: 0 }
    acc[e.course_id].total++
    if (e.status === 'completed') acc[e.course_id].completed++
    return acc
  }, {})

  return (
    <main className="space-y-6 p-4 sm:p-6" dir="rtl">
      <section className="ds-card p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">L&D ACADEMY</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--fi-ink)] sm:text-3xl">أكاديمية التطوير والتعلم</h1>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--fi-muted)]">
          مكتبة معرفية عقارية — تحليل فجوات المهارات — مسارات تعلم مخصصة.
        </p>
      </section>

      <BentoGrid>
        <BentoKpiCard title="المقررات النشطة" value={<AnimatedCount value={courses.length} />} hint="في المكتبة" icon={<BookOpen className="size-5" />} />
        <BentoKpiCard title="إجمالي التسجيلات" value={<AnimatedCount value={enrollments.length} />} hint="موظف × مقرر" icon={<Users className="size-5" />} />
        <BentoKpiCard title="مقررات مكتملة" value={<AnimatedCount value={completedEnrollments} />} hint="بشهادة اجتياز" icon={<CheckCircle2 className="size-5" />} />
        <BentoKpiCard
          title="متوسط الدرجات"
          value={<><AnimatedCount value={Math.round(avgScore)} /><span className="text-base">/100</span></>}
          hint="من المكتملين"
          icon={<TrendingUp className="size-5" />}
        />
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        {canWrite ? <CreateCourseForm /> : (
          <section className="ds-card p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">إنشاء مقرر</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--fi-muted)]">متاح لفريق الموارد البشرية فقط.</p>
          </section>
        )}

        {highGapSkills.length > 0 && (
          <section className="ds-card p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">SKILL GAP ALERT</p>
            <h2 className="mt-1 text-lg font-black text-[var(--fi-ink)]">فجوات مهارات حرجة</h2>
            <div className="mt-4 space-y-3">
              {highGapSkills.slice(0, 6).map((s) => (
                <div key={s.id} className="rounded-lg border border-red-100 bg-red-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-[var(--fi-ink)]">{s.skill_name}</span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700">فجوة: {s.gap}</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-[var(--fi-muted)]">{s.profiles?.full_name ?? 'غير محدد'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 overflow-hidden rounded-full bg-white">
                      <div className="h-1.5 rounded-full bg-red-400 transition-all" style={{ width: `${(s.current_level / s.target_level) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[var(--fi-muted)]">{s.current_level}/{s.target_level}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="ds-card overflow-hidden">
        <div className="border-b border-[var(--fi-line)] p-5">
          <h2 className="text-xl font-black text-[var(--fi-ink)]">مكتبة المقررات</h2>
        </div>
        <div className="divide-y divide-[var(--fi-line)]">
          {courses.map((course) => {
            const stats = enrollmentsByCourse[course.id] ?? { total: 0, completed: 0 }
            const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
            return (
              <div key={course.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between transition hover:bg-[var(--fi-soft)]/60">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-[var(--fi-ink)]">{course.title}</span>
                    {course.is_mandatory && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-black text-red-600">إلزامي</span>
                    )}
                    <span className="rounded-full bg-[var(--fi-soft)] px-2 py-0.5 text-xs font-bold text-[var(--fi-muted)]">
                      {categoryLabel[course.category] ?? course.category}
                    </span>
                  </div>
                  {course.description && (
                    <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)] line-clamp-2">{course.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-[var(--fi-muted)]">
                    {course.target_role && <span>🎯 {course.target_role}</span>}
                    <span>⏱ {course.duration_hours} ساعة</span>
                    {course.content_url && (
                      <a href={course.content_url} target="_blank" rel="noopener noreferrer" className="text-[var(--fi-emerald)] hover:underline">
                        🔗 المحتوى
                      </a>
                    )}
                  </div>
                </div>
                <div className="shrink-0 min-w-[140px] text-left">
                  <div className="text-right">
                    <p className="text-xs font-bold text-[var(--fi-muted)]">{stats.total} مسجّل — {stats.completed} مكتمل</p>
                    <div className="mt-1.5 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                      <div
                        className="h-2 rounded-full bg-[var(--fi-emerald)] transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-black text-[var(--fi-ink)]">{completionPct}% اكتمال</p>
                  </div>
                </div>
              </div>
            )
          })}
          {!courses.length && (
            <div className="px-5 py-12 text-center text-sm font-bold text-[var(--fi-muted)]">
              المكتبة فارغة. أنشئ أول مقرر لفريقك.
            </div>
          )}
        </div>
      </section>

      {skills.length > 0 && (
        <section className="ds-card overflow-hidden">
          <div className="border-b border-[var(--fi-line)] p-5">
            <h2 className="text-xl font-black text-[var(--fi-ink)]">تحليل فجوات المهارات</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-[var(--fi-soft)] text-xs font-black text-[var(--fi-muted)]">
                  <th className="px-4 py-3 text-right">الموظف</th>
                  <th className="px-4 py-3 text-right">المهارة</th>
                  <th className="px-4 py-3 text-right">التصنيف</th>
                  <th className="px-4 py-3 text-right">المستوى الحالي</th>
                  <th className="px-4 py-3 text-right">المستوى المستهدف</th>
                  <th className="px-4 py-3 text-right">الفجوة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fi-line)]">
                {skills.map((skill) => (
                  <tr key={skill.id} className="transition hover:bg-[var(--fi-soft)]/60">
                    <td className="px-4 py-3 font-bold text-[var(--fi-ink)]">{skill.profiles?.full_name ?? 'غير محدد'}</td>
                    <td className="px-4 py-3 font-black text-[var(--fi-ink)]">{skill.skill_name}</td>
                    <td className="px-4 py-3 text-xs font-bold text-[var(--fi-muted)]">{skillCategoryLabel[skill.category] ?? skill.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 overflow-hidden rounded-full bg-[var(--fi-soft)]">
                          <div className="h-2 rounded-full bg-blue-400" style={{ width: `${(skill.current_level / 10) * 100}%` }} />
                        </div>
                        <span className="text-xs font-black text-[var(--fi-ink)]">{skill.current_level}/10</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--fi-muted)]">{skill.target_level}/10</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${skill.gap >= 4 ? 'bg-red-50 text-red-700' : skill.gap >= 2 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {skill.gap === 0 ? '✓ مكتمل' : `-${skill.gap}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}
