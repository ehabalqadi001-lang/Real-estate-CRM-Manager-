'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type AttendanceActionState = { ok: boolean; message: string }

const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

export async function manualAttendanceEntryAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإدخال سجلات الحضور.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const employeeId = String(formData.get('employeeId') ?? '').trim()
    const logDate    = String(formData.get('logDate') ?? '').trim()
    const checkIn    = String(formData.get('checkIn') ?? '').trim()
    const checkOut   = String(formData.get('checkOut') ?? '').trim()
    const status     = String(formData.get('status') ?? 'present').trim()
    const notes      = String(formData.get('notes') ?? '').trim()

    if (!employeeId || !logDate) {
      return { ok: false, message: 'يجب تحديد الموظف والتاريخ.' }
    }

    // Build ISO timestamps from date + time strings
    const checkInIso  = checkIn  ? `${logDate}T${checkIn}:00` : null
    const checkOutIso = checkOut ? `${logDate}T${checkOut}:00` : null

    if (checkInIso && checkOutIso && new Date(checkOutIso) <= new Date(checkInIso)) {
      return { ok: false, message: 'وقت الخروج يجب أن يكون بعد وقت الدخول.' }
    }

    // Upsert into attendance_logs (one record per employee per day)
    const { error: logError } = await service
      .from('attendance_logs')
      .upsert(
        {
          employee_id: employeeId,
          company_id: companyId,
          log_date: logDate,
          check_in: checkInIso,
          check_out: checkOutIso,
          status,
          notes: notes || null,
          recorded_by: session.user.id,
        },
        { onConflict: 'employee_id,log_date' },
      )

    if (logError) throw logError

    // Also upsert today's live attendance table if logDate === today
    const today = new Date().toISOString().slice(0, 10)
    if (logDate === today) {
      const { error: attError } = await service
        .from('attendance')
        .upsert(
          {
            employee_id: employeeId,
            company_id: companyId,
            date: logDate,
            check_in: checkInIso,
            check_out: checkOutIso,
            status,
          },
          { onConflict: 'employee_id,date' },
        )
      if (attError) console.warn('attendance upsert warning:', attError.message)
    }

    revalidatePath('/dashboard/erp/hr/attendance')
    return { ok: true, message: `تم تسجيل الحضور بتاريخ ${logDate} بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ غير متوقع.' }
  }
}

export async function deleteAttendanceLogAction(logId: string): Promise<AttendanceActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بحذف سجلات الحضور.' }
    }

    const service = createServiceRoleClient()
    const { error } = await service.from('attendance_logs').delete().eq('id', logId)
    if (error) throw error

    revalidatePath('/dashboard/erp/hr/attendance')
    return { ok: true, message: 'تم حذف السجل.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر الحذف.' }
  }
}
