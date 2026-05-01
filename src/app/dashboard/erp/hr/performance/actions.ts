'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { sendHRNotification } from '@/lib/hr-notifications'

export type PerfActionState = { ok: boolean; message: string }

const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

function ratingLabel(score: number | null): string {
  if (!score) return ''
  if (score >= 4.5) return 'ممتاز'
  if (score >= 3.5) return 'جيد جداً'
  if (score >= 2.5) return 'جيد'
  if (score >= 1.5) return 'مقبول'
  return 'يحتاج تحسين'
}

export async function createReviewCycleAction(
  _prev: PerfActionState,
  formData: FormData,
): Promise<PerfActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح.' }
    }
    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const reviewCycle  = String(formData.get('reviewCycle') ?? 'annual')
    const periodLabel  = String(formData.get('periodLabel') ?? '').trim()
    const periodStart  = String(formData.get('periodStart') ?? '').trim()
    const periodEnd    = String(formData.get('periodEnd') ?? '').trim()
    const employeeIds  = formData.getAll('employeeIds').map(String)

    if (!periodLabel || !periodStart || !periodEnd || !employeeIds.length) {
      return { ok: false, message: 'يجب تحديد الفترة والموظفين.' }
    }

    const rows = employeeIds.map((empId) => ({
      company_id: companyId,
      employee_id: empId,
      reviewer_id: session.user.id,
      review_cycle: reviewCycle,
      period_label: periodLabel,
      period_start: periodStart,
      period_end:   periodEnd,
      status: 'draft',
    }))

    const { error } = await service.from('performance_reviews').insert(rows)
    if (error) throw error

    // Notify each employee
    for (const empId of employeeIds) {
      const { data: emp } = await service
        .from('employees')
        .select('user_id')
        .eq('id', empId)
        .maybeSingle()
      if (emp?.user_id) {
        await sendHRNotification(service, {
          companyId,
          recipientId: emp.user_id,
          actorId: session.user.id,
          type: 'review_due',
          title: 'تقييم أداء جديد',
          body: `تم إنشاء تقييم أداء للفترة: ${periodLabel}. يُرجى تقديم التقييم الذاتي.`,
          link: '/dashboard/employee',
        })
      }
    }

    revalidatePath('/dashboard/erp/hr/performance')
    return { ok: true, message: `تم إنشاء ${rows.length} تقييم بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function submitSelfAssessmentAction(
  reviewId: string,
  scores: { sales: number; teamwork: number; attendance: number; initiative: number; knowledge: number },
  notes: string,
): Promise<PerfActionState> {
  try {
    const session = await requireSession()
    const service = createServiceRoleClient()

    const { error } = await service
      .from('performance_reviews')
      .update({
        self_score_sales:      scores.sales,
        self_score_teamwork:   scores.teamwork,
        self_score_attendance: scores.attendance,
        self_score_initiative: scores.initiative,
        self_score_knowledge:  scores.knowledge,
        self_notes:            notes || null,
        status:                'self_submitted',
        updated_at:            new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (error) throw error

    // Notify reviewer (HR)
    const { data: review } = await service
      .from('performance_reviews')
      .select('reviewer_id, company_id, period_label, employees!performance_reviews_employee_id_fkey(profiles!employees_id_fkey(full_name))')
      .eq('id', reviewId)
      .maybeSingle()

    if (review?.reviewer_id) {
      const empData = review.employees as any
      const empName = (Array.isArray(empData) ? empData[0] : empData)?.profiles?.full_name ?? 'موظف'
      await sendHRNotification(service, {
        companyId: review.company_id,
        recipientId: review.reviewer_id,
        actorId: session.user.id,
        type: 'review_due',
        title: 'تقييم ذاتي جاهز للمراجعة',
        body: `${empName} أكمل التقييم الذاتي للفترة: ${review.period_label}`,
        link: '/dashboard/erp/hr/performance',
      })
    }

    revalidatePath('/dashboard/erp/hr/performance')
    revalidatePath('/dashboard/employee')
    return { ok: true, message: 'تم تقديم التقييم الذاتي بنجاح.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر الحفظ.' }
  }
}

export async function submitManagerReviewAction(
  reviewId: string,
  scores: { sales: number; teamwork: number; attendance: number; initiative: number; knowledge: number },
  notes: string,
  promotionFlag: boolean,
  salaryIncreasePct: number | null,
): Promise<PerfActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح.' }
    }
    const service = createServiceRoleClient()

    const avgScore =
      (scores.sales * 0.30 + scores.teamwork * 0.20 + scores.attendance * 0.15 +
       scores.initiative * 0.20 + scores.knowledge * 0.15)

    const { error } = await service
      .from('performance_reviews')
      .update({
        mgr_score_sales:       scores.sales,
        mgr_score_teamwork:    scores.teamwork,
        mgr_score_attendance:  scores.attendance,
        mgr_score_initiative:  scores.initiative,
        mgr_score_knowledge:   scores.knowledge,
        mgr_notes:             notes || null,
        rating_label:          ratingLabel(avgScore),
        promotion_flag:        promotionFlag,
        salary_increase_pct:   salaryIncreasePct,
        status:                'completed',
        updated_at:            new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (error) throw error

    // Notify employee
    const { data: review } = await service
      .from('performance_reviews')
      .select('employee_id, company_id, period_label')
      .eq('id', reviewId)
      .maybeSingle()

    if (review) {
      const { data: emp } = await service
        .from('employees')
        .select('user_id')
        .eq('id', review.employee_id)
        .maybeSingle()

      if (emp?.user_id) {
        await sendHRNotification(service, {
          companyId: review.company_id,
          recipientId: emp.user_id,
          actorId: session.user.id,
          type: 'review_due',
          title: 'نتيجة تقييم الأداء',
          body: `اكتمل تقييم أدائك للفترة ${review.period_label} — التقييم: ${ratingLabel(avgScore)}`,
          link: '/dashboard/employee',
        })
      }
    }

    revalidatePath('/dashboard/erp/hr/performance')
    return { ok: true, message: `تم إتمام التقييم. النتيجة: ${ratingLabel(avgScore)}` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر الحفظ.' }
  }
}

export async function addGoalAction(
  _prev: PerfActionState,
  formData: FormData,
): Promise<PerfActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح.' }
    }
    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const employeeId  = String(formData.get('employeeId') ?? '').trim()
    const reviewId    = String(formData.get('reviewId') ?? '').trim() || null
    const title       = String(formData.get('title') ?? '').trim()
    const targetValue = Number(formData.get('targetValue') ?? 0) || null
    const unit        = String(formData.get('unit') ?? '').trim()
    const weightPct   = Number(formData.get('weightPct') ?? 20)
    const dueDate     = String(formData.get('dueDate') ?? '').trim() || null

    if (!employeeId || !title) return { ok: false, message: 'يجب تحديد الموظف والهدف.' }

    const { error } = await service.from('performance_goals').insert({
      company_id: companyId,
      employee_id: employeeId,
      review_id: reviewId,
      title,
      target_value: targetValue,
      unit: unit || null,
      weight_pct: weightPct,
      due_date: dueDate,
      status: 'active',
    })
    if (error) throw error

    revalidatePath('/dashboard/erp/hr/performance')
    return { ok: true, message: 'تمت إضافة الهدف.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function updateGoalActualAction(goalId: string, actualValue: number, status: string): Promise<PerfActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح.' }
    }
    const service = createServiceRoleClient()
    const { error } = await service
      .from('performance_goals')
      .update({ actual_value: actualValue, status })
      .eq('id', goalId)
    if (error) throw error
    revalidatePath('/dashboard/erp/hr/performance')
    return { ok: true, message: 'تم تحديث الهدف.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}
