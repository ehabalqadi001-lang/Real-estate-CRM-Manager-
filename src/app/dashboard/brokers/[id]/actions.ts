'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'
import type { AppRole } from '@/shared/auth/types'

function guard(role: string) {
  const r = role as AppRole
  if (!hasPermission(r, 'broker.manage') && !hasPermission(r, 'account_manager.manage_portfolio')) {
    throw new Error('غير مصرح بهذا الإجراء')
  }
}

export async function holdBroker(brokerId: string, reason: string) {
  const session = await requireSession()
  guard(session.profile.role)

  const service = createServiceRoleClient()
  const { error } = await service
    .from('broker_profiles')
    .update({
      verification_status: 'suspended',
      status: 'inactive',
      hold_reason: reason.trim(),
      held_at: new Date().toISOString(),
      held_by: session.user.id,
    })
    .eq('id', brokerId)

  if (error) throw new Error(error.message)

  // Notify the broker
  const { data: broker } = await service
    .from('broker_profiles')
    .select('profile_id, full_name')
    .eq('id', brokerId)
    .maybeSingle()

  if (broker?.profile_id) {
    await service.from('notifications').insert({
      user_id: broker.profile_id,
      title: 'تم تعليق حسابك',
      message: `تم تعليق حسابك مؤقتاً. السبب: ${reason}`,
      body: `تم تعليق حسابك مؤقتاً. السبب: ${reason}`,
      link: '/broker-portal/profile',
      type: 'warning',
      is_read: false,
    })
  }

  revalidatePath(`/dashboard/brokers/${brokerId}`)
}

export async function unholdBroker(brokerId: string) {
  const session = await requireSession()
  guard(session.profile.role)

  const service = createServiceRoleClient()
  const { error } = await service
    .from('broker_profiles')
    .update({
      verification_status: 'verified',
      status: 'active',
      hold_reason: null,
      held_at: null,
      held_by: null,
    })
    .eq('id', brokerId)

  if (error) throw new Error(error.message)

  const { data: broker } = await service
    .from('broker_profiles')
    .select('profile_id')
    .eq('id', brokerId)
    .maybeSingle()

  if (broker?.profile_id) {
    await service.from('notifications').insert({
      user_id: broker.profile_id,
      title: 'تم رفع التعليق عن حسابك',
      message: 'تم استعادة حسابك وأصبح نشطاً مجدداً.',
      body: 'تم استعادة حسابك وأصبح نشطاً مجدداً.',
      link: '/broker-portal/profile',
      type: 'success',
      is_read: false,
    })
  }

  revalidatePath(`/dashboard/brokers/${brokerId}`)
}

export async function updateBrokerCommission(
  brokerId: string,
  developerRate: number,
  brokerRate: number,
) {
  const session = await requireSession()
  guard(session.profile.role)

  const service = createServiceRoleClient()
  const { error } = await service
    .from('broker_profiles')
    .update({
      developer_commission_rate: developerRate,
      broker_commission_rate: brokerRate,
      commission_rate: brokerRate,
    })
    .eq('id', brokerId)

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/brokers/${brokerId}`)
}

export async function resetBrokerPassword(brokerEmail: string) {
  const session = await requireSession()
  guard(session.profile.role)

  const service = createServiceRoleClient()
  const { data, error } = await service.auth.admin.generateLink({
    type: 'recovery',
    email: brokerEmail,
  })

  if (error) throw new Error(error.message)
  return { link: data.properties?.action_link ?? '' }
}
