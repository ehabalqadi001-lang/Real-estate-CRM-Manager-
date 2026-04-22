'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import { nullableUuid } from '@/lib/uuid'

export type DeveloperAccountActionState = {
  ok: boolean
  message: string
}

export async function linkDeveloperAccountAction(
  _prev: DeveloperAccountActionState,
  formData: FormData,
): Promise<DeveloperAccountActionState> {
  try {
    const session = await requireSession()
    if (!hasPermission(session.profile.role, 'developer.manage')) {
      return { ok: false, message: 'غير مصرح لك بربط حسابات المطورين.' }
    }

    const userId = nullableUuid(formData.get('userId'))
    const developerId = nullableUuid(formData.get('developerId'))
    const role = String(formData.get('role') ?? 'developer_sales')

    if (!userId) return { ok: false, message: 'اختر مستخدماً صحيحاً.' }
    if (!developerId) return { ok: false, message: 'اختر مطوراً صحيحاً.' }

    const service = createServiceRoleClient()
    const { error } = await service.from('developer_accounts').upsert(
      {
        user_id: userId,
        developer_id: developerId,
        role,
        status: 'active',
      },
      { onConflict: 'developer_id,user_id' },
    )

    if (error) throw error

    revalidatePath('/dashboard/developer-accounts')
    revalidatePath('/developer')
    return { ok: true, message: 'تم ربط حساب المطور بنجاح.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر ربط حساب المطور.' }
  }
}

export async function suspendDeveloperAccountAction(accountId: string): Promise<DeveloperAccountActionState> {
  try {
    const session = await requireSession()
    if (!hasPermission(session.profile.role, 'developer.manage')) {
      return { ok: false, message: 'غير مصرح لك بتعديل حسابات المطورين.' }
    }

    const id = nullableUuid(accountId)
    if (!id) return { ok: false, message: 'معرف الحساب غير صحيح.' }

    const service = createServiceRoleClient()
    const { error } = await service
      .from('developer_accounts')
      .update({ status: 'suspended' })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/developer-accounts')
    revalidatePath('/developer')
    return { ok: true, message: 'تم تعليق حساب المطور.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر تعليق الحساب.' }
  }
}

export async function grantDeveloperProjectAccessAction(
  _prev: DeveloperAccountActionState,
  formData: FormData,
): Promise<DeveloperAccountActionState> {
  try {
    const session = await requireSession()
    if (!hasPermission(session.profile.role, 'developer.manage')) {
      return { ok: false, message: 'غير مصرح لك بتعديل صلاحيات مشاريع المطورين.' }
    }

    const developerAccountId = nullableUuid(formData.get('developerAccountId'))
    const projectId = nullableUuid(formData.get('projectId'))

    if (!developerAccountId) return { ok: false, message: 'اختر حساب مطور صحيح.' }
    if (!projectId) return { ok: false, message: 'اختر مشروع صحيح.' }

    const service = createServiceRoleClient()
    const { data: account, error: accountError } = await service
      .from('developer_accounts')
      .select('id, developer_id')
      .eq('id', developerAccountId)
      .maybeSingle()

    if (accountError) throw accountError
    if (!account) return { ok: false, message: 'حساب المطور غير موجود.' }

    const { data: project, error: projectError } = await service
      .from('projects')
      .select('id, developer_id')
      .eq('id', projectId)
      .maybeSingle()

    if (projectError) throw projectError
    if (!project) return { ok: false, message: 'المشروع غير موجود.' }
    if (project.developer_id !== account.developer_id) {
      return { ok: false, message: 'لا يمكن ربط الحساب بمشروع تابع لمطور آخر.' }
    }

    const { error } = await service.from('developer_projects_access').upsert(
      {
        developer_account_id: developerAccountId,
        project_id: projectId,
        can_view_leads: formData.get('canViewLeads') === 'on',
        can_manage_inventory: formData.get('canManageInventory') === 'on',
        can_manage_media: formData.get('canManageMedia') === 'on',
        can_manage_meetings: formData.get('canManageMeetings') === 'on',
      },
      { onConflict: 'developer_account_id,project_id' },
    )

    if (error) throw error

    revalidatePath('/dashboard/developer-accounts')
    revalidatePath('/developer')
    return { ok: true, message: 'تم ربط حساب المطور بالمشروع وتحديث الصلاحيات.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر تحديث صلاحيات المشروع.' }
  }
}

export async function revokeDeveloperProjectAccessAction(accessId: string): Promise<DeveloperAccountActionState> {
  try {
    const session = await requireSession()
    if (!hasPermission(session.profile.role, 'developer.manage')) {
      return { ok: false, message: 'غير مصرح لك بحذف صلاحيات المشاريع.' }
    }

    const id = nullableUuid(accessId)
    if (!id) return { ok: false, message: 'معرف الصلاحية غير صحيح.' }

    const service = createServiceRoleClient()
    const { error } = await service.from('developer_projects_access').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/dashboard/developer-accounts')
    revalidatePath('/developer')
    return { ok: true, message: 'تم حذف صلاحية المشروع.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر حذف صلاحية المشروع.' }
  }
}
