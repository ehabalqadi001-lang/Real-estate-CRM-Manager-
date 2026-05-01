'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type AcademyActionState = { ok: boolean; message: string }

const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

export async function createCourseAction(
  _prev: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإنشاء مقررات.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const title = String(formData.get('title') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const targetRole = String(formData.get('targetRole') ?? '').trim()
    const category = String(formData.get('category') ?? 'sales_skills')
    const durationHours = Number(formData.get('durationHours') ?? 1)
    const contentUrl = String(formData.get('contentUrl') ?? '').trim()
    const isMandatory = formData.get('isMandatory') === 'on'

    if (!title) return { ok: false, message: 'عنوان المقرر مطلوب.' }

    const { error } = await service.from('learning_courses').insert({
      company_id: companyId,
      title,
      description: description || null,
      target_role: targetRole || null,
      category,
      duration_hours: durationHours,
      content_url: contentUrl || null,
      is_mandatory: isMandatory,
      status: 'active',
      created_by: session.user.id,
    })

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/academy')
    return { ok: true, message: `تم إنشاء مقرر "${title}" بنجاح.` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.' }
  }
}

export async function enrollEmployeeAction(
  courseId: string,
  employeeId: string,
): Promise<AcademyActionState> {
  try {
    const session = await requireSession()
    const service = createServiceRoleClient()

    const { error } = await service.from('course_enrollments').upsert({
      course_id: courseId,
      employee_id: employeeId,
      enrolled_by: session.user.id,
      status: 'enrolled',
      enrolled_at: new Date().toISOString(),
    }, { onConflict: 'course_id,employee_id' })

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/academy')
    return { ok: true, message: 'تم تسجيل الموظف في المقرر.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر التسجيل.' }
  }
}

export async function markCourseCompleteAction(
  enrollmentId: string,
  score: number,
): Promise<AcademyActionState> {
  try {
    const session = await requireSession()
    const service = createServiceRoleClient()

    const { error } = await service
      .from('course_enrollments')
      .update({
        status: 'completed',
        score,
        completed_at: new Date().toISOString(),
        marked_by: session.user.id,
      })
      .eq('id', enrollmentId)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/academy')
    return { ok: true, message: 'تم تسجيل إتمام المقرر.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر تحديث الحالة.' }
  }
}

export async function saveSkillAssessmentAction(
  _prev: AcademyActionState,
  formData: FormData,
): Promise<AcademyActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بتقييم المهارات.' }
    }

    const service = createServiceRoleClient()

    const employeeId = String(formData.get('employeeId') ?? '').trim()
    const skillName = String(formData.get('skillName') ?? '').trim()
    const currentLevel = Number(formData.get('currentLevel') ?? 0)
    const targetLevel = Number(formData.get('targetLevel') ?? 5)
    const category = String(formData.get('category') ?? 'sales')
    const notes = String(formData.get('notes') ?? '').trim()

    if (!employeeId || !skillName) {
      return { ok: false, message: 'الموظف واسم المهارة مطلوبان.' }
    }

    const gap = Math.max(0, targetLevel - currentLevel)

    const { error } = await service.from('skill_assessments').upsert({
      employee_id: employeeId,
      skill_name: skillName,
      current_level: currentLevel,
      target_level: targetLevel,
      gap,
      category,
      notes: notes || null,
      assessed_by: session.user.id,
      assessed_at: new Date().toISOString(),
    }, { onConflict: 'employee_id,skill_name' })

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/academy')
    return { ok: true, message: `تم تسجيل تقييم مهارة "${skillName}".` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.' }
  }
}
