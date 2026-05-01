'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type PayrollActionState = { ok: boolean; message: string }

const PAYROLL_RUN_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager']

export async function runPayrollAction(
  _prev: PayrollActionState,
  formData: FormData,
): Promise<PayrollActionState> {
  try {
    const session = await requireSession()
    if (!PAYROLL_RUN_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'صلاحية إصدار الرواتب متاحة لمدير الموارد البشرية فقط.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id
    if (!companyId) return { ok: false, message: 'لا توجد شركة مرتبطة بهذا الحساب.' }

    const month = Number(formData.get('month'))
    const year = Number(formData.get('year'))
    const workingDays = Number(formData.get('workingDays') ?? 22)

    if (!month || !year || month < 1 || month > 12) {
      return { ok: false, message: 'الشهر والسنة غير صحيحَين.' }
    }

    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    const monthStart = `${monthStr}-01`
    const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

    // Load active employees
    const { data: employees, error: empErr } = await service
      .from('employees')
      .select('id, user_id, basic_salary, base_salary, commission_rate')
      .eq('company_id', companyId)
      .eq('status', 'active')

    if (empErr) throw empErr
    if (!employees?.length) return { ok: false, message: 'لا يوجد موظفون نشطون في هذه الشركة.' }

    // Load attendance logs for the month
    const { data: attendanceLogs } = await service
      .from('attendance_logs')
      .select('employee_id, log_date, status')
      .eq('company_id', companyId)
      .gte('log_date', monthStart)
      .lt('log_date', nextMonth)

    // Load approved commissions for the month
    const { data: commissions } = await service
      .from('commission_deals')
      .select('employee_id, triggered_commission')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .gte('approved_at', `${monthStr}-01`)
      .lt('approved_at', nextMonth)

    const attendanceMap = (attendanceLogs ?? []).reduce<Record<string, { present: number; absent: number; late: number }>>((acc, log) => {
      if (!acc[log.employee_id]) acc[log.employee_id] = { present: 0, absent: 0, late: 0 }
      if (log.status === 'present') acc[log.employee_id].present++
      else if (log.status === 'absent') acc[log.employee_id].absent++
      else if (log.status === 'late') acc[log.employee_id].late++
      return acc
    }, {})

    const commissionMap = (commissions ?? []).reduce<Record<string, number>>((acc, c) => {
      acc[c.employee_id] = (acc[c.employee_id] ?? 0) + Number(c.triggered_commission)
      return acc
    }, {})

    let processed = 0
    for (const emp of employees) {
      const basicSalary = Number(emp.basic_salary ?? emp.base_salary ?? 0)
      const attendance = attendanceMap[emp.id] ?? { present: 0, absent: 0, late: 0 }
      const totalCommissions = commissionMap[emp.id] ?? 0

      // Daily rate
      const dailyRate = workingDays > 0 ? basicSalary / workingDays : 0
      // Deduct absent days + half-day for each late (capped at daily/2)
      const absenceDeduction = attendance.absent * dailyRate
      const lateDeduction = Math.min(attendance.late * (dailyRate * 0.25), dailyRate * 2)
      const deductions = absenceDeduction + lateDeduction
      const grossSalary = basicSalary + totalCommissions
      const netSalary = Math.max(0, grossSalary - deductions)

      await service.from('payroll').upsert({
        employee_id: emp.id,
        company_id: companyId,
        month,
        year,
        basic_salary: basicSalary,
        present_days: attendance.present,
        absent_days: attendance.absent,
        late_count: attendance.late,
        total_commissions: totalCommissions,
        deductions,
        gross_salary: grossSalary,
        net_salary: netSalary,
        status: 'draft',
        generated_by: session.user.id,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'employee_id,month,year' })

      processed++
    }

    revalidatePath('/dashboard/erp/hr/payroll')
    return { ok: true, message: `تم إنشاء مسيرة ${month}/${year} لـ ${processed} موظف بنجاح.` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.' }
  }
}

export async function approvePayrollAction(
  employeeId: string,
  month: number,
  year: number,
): Promise<PayrollActionState> {
  try {
    const session = await requireSession()
    if (!PAYROLL_RUN_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإقرار الرواتب.' }
    }

    const service = createServiceRoleClient()
    const { error } = await service
      .from('payroll')
      .update({ status: 'approved', approved_by: session.user.id, approved_at: new Date().toISOString() })
      .eq('employee_id', employeeId)
      .eq('month', month)
      .eq('year', year)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/payroll')
    return { ok: true, message: 'تم إقرار الراتب.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر إقرار الراتب.' }
  }
}

export async function approveAllPayrollAction(
  month: number,
  year: number,
  companyId: string,
): Promise<PayrollActionState> {
  try {
    const session = await requireSession()
    if (!PAYROLL_RUN_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإقرار الرواتب.' }
    }

    const service = createServiceRoleClient()
    const { error } = await service
      .from('payroll')
      .update({ status: 'approved', approved_by: session.user.id, approved_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('month', month)
      .eq('year', year)
      .eq('status', 'draft')

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/payroll')
    return { ok: true, message: 'تمت الموافقة على جميع الرواتب.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر إقرار الرواتب.' }
  }
}
