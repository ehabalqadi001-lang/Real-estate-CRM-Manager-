'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type OnboardingActionState = { ok: boolean; message: string }

const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

const DEFAULT_TASKS: Array<{
  task_title: string
  task_description: string
  category: string
  order_index: number
  is_required: boolean
}> = [
  { task_title: 'استلام عقد العمل وتوقيعه',      task_description: 'مراجعة وتوقيع عقد التوظيف الرسمي',              category: 'document',  order_index: 1,  is_required: true },
  { task_title: 'تسليم صورة بطاقة الهوية',        task_description: 'نسخة من البطاقة الوطنية أو جواز السفر',          category: 'document',  order_index: 2,  is_required: true },
  { task_title: 'استلام بيانات الحساب البنكي',     task_description: 'رقم IBAN لتحويل الراتب',                         category: 'document',  order_index: 3,  is_required: true },
  { task_title: 'إنشاء حساب في النظام',            task_description: 'إعداد بيانات الدخول وتحديد الصلاحيات',           category: 'access',    order_index: 4,  is_required: true },
  { task_title: 'تعريف على مدير المبيعات',         task_description: 'اجتماع تعريفي مع المدير المباشر',                category: 'intro',     order_index: 5,  is_required: true },
  { task_title: 'جولة في مكان العمل',              task_description: 'التعرف على المكتب والأقسام والزملاء',             category: 'intro',     order_index: 6,  is_required: false },
  { task_title: 'إتمام دورة المنتجات والمشاريع',    task_description: 'دراسة المشاريع الرئيسية والمخطط التدريبي الأول',  category: 'training',  order_index: 7,  is_required: true },
  { task_title: 'استلام الأجهزة والمعدات',         task_description: 'لابتوب / بطاقة موظف / أي معدات مطلوبة',          category: 'equipment', order_index: 8,  is_required: false },
  { task_title: 'اختبار تقييم المعرفة (أسبوع 2)',  task_description: 'اختبار قصير بعد أسبوع من الالتحاق',              category: 'training',  order_index: 9,  is_required: true },
  { task_title: 'مراجعة الشهر الأول',              task_description: 'تقييم الأداء والملاحظات بعد 30 يوماً',            category: 'review',    order_index: 10, is_required: true },
]

export async function initOnboardingAction(employeeId: string): Promise<OnboardingActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك ببدء بروتوكول الاستقبال.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    // Check if already initialised
    const { data: existing } = await service
      .from('onboarding_tasks')
      .select('id')
      .eq('employee_id', employeeId)
      .limit(1)

    if (existing?.length) {
      return { ok: false, message: 'بروتوكول الاستقبال مُفعَّل بالفعل لهذا الموظف.' }
    }

    const today = new Date()
    const tasks = DEFAULT_TASKS.map((t) => ({
      ...t,
      company_id: companyId,
      employee_id: employeeId,
      due_date: new Date(today.getTime() + t.order_index * 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    }))

    const { error } = await service.from('onboarding_tasks').insert(tasks)
    if (error) throw error

    revalidatePath('/dashboard/erp/hr/onboarding')
    return { ok: true, message: `تم تفعيل بروتوكول الاستقبال — ${tasks.length} مهمة أُنشئت.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function completeOnboardingTaskAction(taskId: string): Promise<OnboardingActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح.' }
    }

    const service = createServiceRoleClient()
    const { error } = await service
      .from('onboarding_tasks')
      .update({ completed_at: new Date().toISOString(), completed_by: session.user.id })
      .eq('id', taskId)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/onboarding')
    return { ok: true, message: 'تم إنجاز المهمة.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر التحديث.' }
  }
}

export async function uncompleteOnboardingTaskAction(taskId: string): Promise<OnboardingActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح.' }
    }

    const service = createServiceRoleClient()
    const { error } = await service
      .from('onboarding_tasks')
      .update({ completed_at: null, completed_by: null })
      .eq('id', taskId)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/onboarding')
    return { ok: true, message: 'تم التراجع عن الإنجاز.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر التحديث.' }
  }
}

export async function addCustomOnboardingTaskAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const employeeId  = String(formData.get('employeeId') ?? '').trim()
    const taskTitle   = String(formData.get('taskTitle') ?? '').trim()
    const category    = String(formData.get('category') ?? 'general').trim()
    const dueDate     = String(formData.get('dueDate') ?? '').trim()
    const isRequired  = formData.get('isRequired') === 'true'

    if (!employeeId || !taskTitle) {
      return { ok: false, message: 'يجب تحديد الموظف وعنوان المهمة.' }
    }

    const { error } = await service.from('onboarding_tasks').insert({
      company_id: companyId,
      employee_id: employeeId,
      task_title: taskTitle,
      category,
      due_date: dueDate || null,
      is_required: isRequired,
      order_index: 99,
    })

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/onboarding')
    return { ok: true, message: 'تمت إضافة المهمة.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}
