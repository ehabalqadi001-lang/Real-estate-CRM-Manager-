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
