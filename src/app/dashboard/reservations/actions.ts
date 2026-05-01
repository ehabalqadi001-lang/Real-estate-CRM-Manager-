'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type ReservationActionState = { ok: boolean; message: string }

const CREATE_ALLOWED: AppRole[] = [
  'super_admin', 'platform_admin', 'company_owner', 'company_admin',
  'branch_manager', 'senior_agent', 'sales_director', 'team_leader',
  'account_manager', 'agent',
]
const MANAGE_ALLOWED: AppRole[] = [
  'super_admin', 'platform_admin', 'company_owner', 'company_admin',
  'sales_director', 'branch_manager',
]

export async function createReservationAction(
  _prev: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  try {
    const session = await requireSession()
    if (!CREATE_ALLOWED.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بإنشاء حجوزات.' }
    }

    const service   = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const unitId         = String(formData.get('unitId')         ?? '').trim()
    const clientName     = String(formData.get('clientName')     ?? '').trim()
    const clientPhone    = String(formData.get('clientPhone')    ?? '').trim()
    const reservationFee = formData.get('reservationFee') ? Number(formData.get('reservationFee')) : 0
    const depositAmount  = formData.get('depositAmount')  ? Number(formData.get('depositAmount'))  : null
    const notes          = String(formData.get('notes')         ?? '').trim()

    if (!unitId || !clientName) {
      return { ok: false, message: 'الوحدة واسم العميل مطلوبان.' }
    }

    const { data: unit } = await service
      .from('inventory')
      .select('id, status')
      .eq('id', unitId)
      .single()

    if (!unit) return { ok: false, message: 'الوحدة غير موجودة.' }
    if (unit.status === 'reserved') return { ok: false, message: 'الوحدة محجوزة بالفعل.' }
    if (unit.status === 'sold')     return { ok: false, message: 'الوحدة مباعة ولا يمكن حجزها.' }

    const { error } = await service.from('unit_reservations').insert({
      company_id:      companyId,
      unit_id:         unitId,
      agent_id:        session.profile.id,
      reserved_by:     session.profile.id,
      client_name:     clientName,
      client_phone:    clientPhone || null,
      deposit_amount:  depositAmount,
      reservation_fee: reservationFee,
      notes:           notes || null,
      status:          'active',
    })
    if (error) throw error

    revalidatePath('/dashboard/reservations')
    return { ok: true, message: `تم إنشاء الحجز للعميل ${clientName} بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function cancelReservationAction(
  _prev: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  try {
    const session = await requireSession()
    if (!MANAGE_ALLOWED.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بإلغاء الحجوزات.' }
    }

    const service       = createServiceRoleClient()
    const reservationId = String(formData.get('reservationId') ?? '').trim()
    const cancelReason  = String(formData.get('cancelReason')  ?? '').trim()

    if (!reservationId) return { ok: false, message: 'معرّف الحجز مطلوب.' }

    const { error } = await service
      .from('unit_reservations')
      .update({
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason || null,
      })
      .eq('id', reservationId)
    if (error) throw error

    revalidatePath('/dashboard/reservations')
    return { ok: true, message: 'تم إلغاء الحجز بنجاح.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function convertReservationToDealAction(
  _prev: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  try {
    const session = await requireSession()
    if (!MANAGE_ALLOWED.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بتحويل الحجز إلى صفقة.' }
    }

    const service       = createServiceRoleClient()
    const reservationId = String(formData.get('reservationId') ?? '').trim()
    if (!reservationId) return { ok: false, message: 'معرّف الحجز مطلوب.' }

    const { data: res } = await service
      .from('unit_reservations')
      .select('id, unit_id, client_name, client_phone, agent_id, company_id, deposit_amount, reservation_fee, notes, status')
      .eq('id', reservationId)
      .single()

    if (!res) return { ok: false, message: 'الحجز غير موجود.' }
    if (res.status === 'converted') return { ok: false, message: 'تم تحويل هذا الحجز مسبقاً.' }
    if (res.status === 'cancelled') return { ok: false, message: 'لا يمكن تحويل حجز ملغى.' }

    const { error: dealError } = await service
      .from('deals')
      .insert({
        company_id:          res.company_id,
        agent_id:            res.agent_id,
        assigned_to:         res.agent_id,
        client_name:         res.client_name,
        buyer_name:          res.client_name,
        unit_id:             res.unit_id,
        unit_reservation_id: res.id,
        amount:              Number(res.deposit_amount ?? 0),
        value:               Number(res.deposit_amount ?? 0),
        source:              'reservation',
        stage:               'New',
        status:              'Lead',
        deal_date:           new Date().toISOString().slice(0, 10),
        notes:               res.notes ?? null,
      })
    if (dealError) throw dealError

    await service
      .from('unit_reservations')
      .update({ status: 'converted', converted_at: new Date().toISOString() })
      .eq('id', reservationId)

    revalidatePath('/dashboard/reservations')
    revalidatePath('/dashboard/deals')
    return { ok: true, message: `تم إنشاء الصفقة للعميل ${res.client_name} بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function extendReservationAction(
  _prev: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  try {
    await requireSession()
    const service       = createServiceRoleClient()
    const reservationId = String(formData.get('reservationId') ?? '').trim()

    if (!reservationId) return { ok: false, message: 'معرّف الحجز مطلوب.' }

    const { data: res } = await service
      .from('unit_reservations')
      .select('expires_at, extension_count, max_extensions')
      .eq('id', reservationId)
      .single()

    if (!res) return { ok: false, message: 'الحجز غير موجود.' }
    if ((res.extension_count ?? 0) >= (res.max_extensions ?? 2)) {
      return { ok: false, message: 'تجاوز الحد الأقصى للتمديد.' }
    }

    const newExpiry = new Date(res.expires_at ?? new Date())
    newExpiry.setHours(newExpiry.getHours() + 48)

    const { error } = await service
      .from('unit_reservations')
      .update({
        expires_at:      newExpiry.toISOString(),
        extension_count: (res.extension_count ?? 0) + 1,
      })
      .eq('id', reservationId)
    if (error) throw error

    revalidatePath('/dashboard/reservations')
    return { ok: true, message: 'تم تمديد الحجز 48 ساعة إضافية.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}
