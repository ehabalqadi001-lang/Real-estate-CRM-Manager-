'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import type { AppRole } from '@/shared/auth/types'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function assertHrOrManager(role: AppRole) {
  const allowed = hasPermission(role, 'broker.assign_manager')
  if (!allowed) throw new Error('غير مصرح: صلاحية تعيين Account Manager مطلوبة')
}

async function sendNotification(service: ReturnType<typeof createServiceRoleClient>, opts: {
  userId: string; title: string; message: string; link: string; type?: string
}) {
  await service.from('notifications').insert({
    user_id: opts.userId,
    title: opts.title,
    message: opts.message,
    body: opts.message,
    link: opts.link,
    type: opts.type ?? 'info',
    company_id: null,
    is_read: false,
  }).then(({ error }) => { if (error) console.error('notification error', error.message) })
}

export type AssignAmState = { success: boolean; message: string }

export async function assignAmToBroker(
  _prev: AssignAmState,
  formData: FormData,
): Promise<AssignAmState> {
  try {
    const session = await requireSession()
    assertHrOrManager(session.profile.role)

    const brokerProfileId = text(formData, 'brokerProfileId')
    const accountManagerId = text(formData, 'accountManagerId')
    const notes = text(formData, 'notes')

    if (!brokerProfileId || !accountManagerId) {
      return { success: false, message: 'يرجى تحديد الشريك والـ Account Manager' }
    }

    const service = createServiceRoleClient()

    const [{ data: manager, error: managerError }, { data: brokerProfile, error: bpError }] = await Promise.all([
      service.from('profiles').select('id, full_name, email, role').eq('id', accountManagerId).maybeSingle(),
      service.from('broker_profiles').select('profile_id, display_name, verification_status').eq('profile_id', brokerProfileId).maybeSingle(),
    ])

    if (managerError) return { success: false, message: managerError.message }
    if (bpError) return { success: false, message: bpError.message }
    if (!manager) return { success: false, message: 'Account Manager غير موجود' }
    if (!brokerProfile) return { success: false, message: 'الشريك غير موجود في النظام' }

    // Update all 3 tables atomically (Supabase doesn't support transactions in JS client,
    // so we update sequentially and log any partial failure)
    const [r1, r2, r3] = await Promise.all([
      service.from('broker_profiles').update({ account_manager_id: accountManagerId }).eq('profile_id', brokerProfileId),
      service.from('user_profiles').update({ account_manager_id: accountManagerId }).eq('id', brokerProfileId),
      service.from('broker_sales_submissions')
        .update({ assigned_account_manager_id: accountManagerId })
        .eq('broker_user_id', brokerProfileId)
        .in('status', ['draft', 'submitted', 'under_review']),
    ])

    if (r1.error) return { success: false, message: `خطأ في تحديث بيانات الشريك: ${r1.error.message}` }
    if (r2.error) return { success: false, message: `خطأ في تحديث الملف الشخصي: ${r2.error.message}` }

    // Update latest partner application if exists
    const { data: latestApp } = await service
      .from('partner_applications')
      .select('id')
      .eq('profile_id', brokerProfileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestApp) {
      await service.from('partner_applications').update({ assigned_account_manager_id: accountManagerId }).eq('id', latestApp.id)
    }

    // Audit log
    await service.from('am_broker_assignments').insert({
      broker_id: brokerProfileId,
      am_id: accountManagerId,
      assigned_by: session.user.id,
      notes: notes || null,
    })

    // Notify the assigned AM
    await sendNotification(service, {
      userId: accountManagerId,
      title: 'تم تعيينك Account Manager لشريك جديد',
      message: `تم تعيينك مسؤولاً عن الشريك: ${brokerProfile.display_name ?? brokerProfileId}`,
      link: '/dashboard/account-manager',
      type: 'info',
    })

    r3 // acknowledge (partial failure in sales update is non-critical)

    revalidatePath('/dashboard/hr/assign-managers')
    revalidatePath('/dashboard/partners')
    revalidatePath('/dashboard/account-manager')

    return { success: true, message: `تم تعيين ${manager.full_name ?? manager.email} بنجاح` }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' }
  }
}

export async function removeAmFromBroker(
  _prev: AssignAmState,
  formData: FormData,
): Promise<AssignAmState> {
  try {
    const session = await requireSession()
    assertHrOrManager(session.profile.role)

    const brokerProfileId = text(formData, 'brokerProfileId')
    if (!brokerProfileId) return { success: false, message: 'الشريك غير محدد' }

    const service = createServiceRoleClient()

    await Promise.all([
      service.from('broker_profiles').update({ account_manager_id: null }).eq('profile_id', brokerProfileId),
      service.from('user_profiles').update({ account_manager_id: null }).eq('id', brokerProfileId),
    ])

    revalidatePath('/dashboard/hr/assign-managers')
    revalidatePath('/dashboard/partners')

    return { success: true, message: 'تم إلغاء تعيين Account Manager' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' }
  }
}
