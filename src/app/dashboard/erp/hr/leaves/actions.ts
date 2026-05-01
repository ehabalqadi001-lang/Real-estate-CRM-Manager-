'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type LeaveActionState = { ok: boolean; message: string }

const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

function workingDaysBetween(start: string, end: string): number {
  let count = 0
  const cur = new Date(start)
  const endDate = new Date(end)
  while (cur <= endDate) {
    const day = cur.getDay()
    if (day !== 5 && day !== 6) count++ // skip Fri & Sat (Arabic weekend)
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export async function requestLeaveAction(
  _prev: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  try {
    const session = await requireSession()
    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const employeeId = String(formData.get('employeeId') ?? '').trim()
    const leaveTypeId = String(formData.get('leaveTypeId') ?? '').trim()
    const startDate = String(formData.get('startDate') ?? '').trim()
    const endDate = String(formData.get('endDate') ?? '').trim()
    const reason = String(formData.get('reason') ?? '').trim()

    if (!employeeId || !leaveTypeId || !startDate || !endDate) {
      return { ok: false, message: 'يجب تحديد الموظف ونوع الإجازة والتواريخ.' }
    }
    if (new Date(endDate) < new Date(startDate)) {
      return { ok: false, message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية.' }
    }

    const daysCount = workingDaysBetween(startDate, endDate)

    // Check for overlapping pending/approved requests
    const { data: overlap } = await service
      .from('leave_requests')
      .select('id')
      .eq('employee_id', employeeId)
      .in('status', ['pending', 'approved'])
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .limit(1)

    if (overlap?.length) {
      return { ok: false, message: 'يوجد طلب إجازة متداخل مع هذه الفترة.' }
    }

    const { error } = await service.from('leave_requests').insert({
      company_id: companyId,
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      days_count: daysCount,
      reason: reason || null,
      status: 'pending',
    })

    if (error) throw error

    // Increment pending_days in leave_balances
    const year = new Date(startDate).getFullYear()
    await service.rpc('increment_leave_pending', {
      p_employee_id: employeeId,
      p_leave_type_id: leaveTypeId,
      p_year: year,
      p_days: daysCount,
      p_company_id: companyId,
    }).maybeSingle().then(() => null, () => null) // RPC may not exist yet; fail silently

    revalidatePath('/dashboard/erp/hr/leaves')
    revalidatePath('/dashboard/employee')
    return { ok: true, message: `تم تقديم طلب إجازة بنجاح (${daysCount} أيام عمل).` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ غير متوقع.' }
  }
}

export async function approveLeaveAction(requestId: string): Promise<LeaveActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإقرار الإجازات.' }
    }

    const service = createServiceRoleClient()
    const { data: req, error: fetchErr } = await service
      .from('leave_requests')
      .select('employee_id, leave_type_id, days_count, start_date, status')
      .eq('id', requestId)
      .single()

    if (fetchErr || !req) return { ok: false, message: 'الطلب غير موجود.' }
    if (req.status !== 'pending') return { ok: false, message: 'الطلب ليس في حالة انتظار.' }

    const { error } = await service
      .from('leave_requests')
      .update({ status: 'approved', approved_by: session.user.id, decided_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) throw error

    // Upsert balance: increment used_days, reset pending_days
    const year = new Date(req.start_date).getFullYear()
    const { data: empData } = await service.from('employees').select('company_id').eq('id', req.employee_id).maybeSingle()
    const { data: existing } = await service
      .from('leave_balances')
      .select('id, used_days, pending_days')
      .eq('employee_id', req.employee_id)
      .eq('leave_type_id', req.leave_type_id)
      .eq('year', year)
      .maybeSingle()

    if (existing) {
      await service
        .from('leave_balances')
        .update({
          used_days: Number(existing.used_days ?? 0) + Number(req.days_count),
          pending_days: Math.max(0, Number(existing.pending_days ?? 0) - Number(req.days_count)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .maybeSingle().then(() => null, () => null)
    } else {
      await service.from('leave_balances').insert({
        company_id: empData?.company_id,
        employee_id: req.employee_id,
        leave_type_id: req.leave_type_id,
        year,
        total_days: 21,
        used_days: Number(req.days_count),
        pending_days: 0,
      }).maybeSingle().then(() => null, () => null)
    }

    revalidatePath('/dashboard/erp/hr/leaves')
    revalidatePath('/dashboard/employee')
    return { ok: true, message: 'تمت الموافقة على الإجازة.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر إقرار الإجازة.' }
  }
}

export async function rejectLeaveAction(requestId: string, notes: string): Promise<LeaveActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك برفض الإجازات.' }
    }

    const service = createServiceRoleClient()
    const { data: req } = await service
      .from('leave_requests')
      .select('employee_id, leave_type_id, days_count, start_date, status')
      .eq('id', requestId)
      .single()

    if (!req) return { ok: false, message: 'الطلب غير موجود.' }
    if (req.status !== 'pending') return { ok: false, message: 'الطلب ليس في حالة انتظار.' }

    const { error } = await service
      .from('leave_requests')
      .update({
        status: 'rejected',
        manager_notes: notes || null,
        approved_by: session.user.id,
        decided_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/leaves')
    revalidatePath('/dashboard/employee')
    return { ok: true, message: 'تم رفض طلب الإجازة.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر رفض الإجازة.' }
  }
}

export async function cancelLeaveAction(requestId: string): Promise<LeaveActionState> {
  try {
    const session = await requireSession()
    const service = createServiceRoleClient()

    const { data: req } = await service
      .from('leave_requests')
      .select('employee_id, status')
      .eq('id', requestId)
      .single()

    if (!req) return { ok: false, message: 'الطلب غير موجود.' }
    if (req.status === 'approved') return { ok: false, message: 'لا يمكن إلغاء إجازة مُقرَّرة. تواصل مع HR.' }

    const { error } = await service
      .from('leave_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/leaves')
    revalidatePath('/dashboard/employee')
    return { ok: true, message: 'تم إلغاء طلب الإجازة.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر الإلغاء.' }
  }
}
