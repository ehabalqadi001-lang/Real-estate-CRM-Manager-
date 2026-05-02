'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type PayrollActionState = { ok: boolean; message: string }

const PAYROLL_RUN_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager']

// Egyptian Income Tax — Law 91/2005 (progressive annual brackets)
function calcEgyptianTax(annualTaxable: number): number {
  const brackets = [
    { from: 0,       to: 15_000,   rate: 0 },
    { from: 15_000,  to: 30_000,   rate: 0.025 },
    { from: 30_000,  to: 45_000,   rate: 0.10 },
    { from: 45_000,  to: 60_000,   rate: 0.15 },
    { from: 60_000,  to: 200_000,  rate: 0.20 },
    { from: 200_000, to: 400_000,  rate: 0.225 },
    { from: 400_000, to: Infinity, rate: 0.25 },
  ]
  let tax = 0
  for (const b of brackets) {
    if (annualTaxable <= b.from) break
    tax += (Math.min(annualTaxable, b.to) - b.from) * b.rate
  }
  return tax
}

const SOCIAL_INS_RATE = 0.11 // employee share (Egyptian Social Insurance Law)

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
    const globalAllowances = Number(formData.get('allowances') ?? 0)
    const globalBonus = Number(formData.get('bonus') ?? 0)
    const globalOvertime = Number(formData.get('overtime') ?? 0)

    if (!month || !year || month < 1 || month > 12) {
      return { ok: false, message: 'الشهر والسنة غير صحيحَين.' }
    }

    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    const monthStart = `${monthStr}-01`
    const nextMonthStart = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`

    // Load active employees with user_id for CRM commission join
    const { data: employees, error: empErr } = await service
      .from('employees')
      .select('id, user_id, basic_salary, base_salary')
      .eq('company_id', companyId)
      .eq('status', 'active')

    if (empErr) throw empErr
    if (!employees?.length) return { ok: false, message: 'لا يوجد موظفون نشطون في هذه الشركة.' }

    // Attendance logs
    const { data: attendanceLogs } = await service
      .from('attendance_logs')
      .select('employee_id, log_date, status')
      .eq('company_id', companyId)
      .gte('log_date', monthStart)
      .lt('log_date', nextMonthStart)

    // HR commission_deals (linked by employee_id)
    const { data: hrCommissions } = await service
      .from('commission_deals')
      .select('employee_id, triggered_commission')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .gte('approved_at', monthStart)
      .lt('approved_at', nextMonthStart)

    // CRM commissions table (linked by agent_id = user_id)
    const userIds = employees.map((e) => e.user_id).filter(Boolean)
    const { data: crmCommissions } = userIds.length
      ? await service
          .from('commissions')
          .select('agent_id, amount')
          .in('agent_id', userIds)
          .eq('company_id', companyId)
          .eq('status', 'approved')
          .gte('created_at', monthStart)
          .lt('created_at', nextMonthStart)
      : { data: [] }

    // Approved unpaid leave requests
    const empIds = employees.map((e) => e.id)
    const { data: leaveRequests } = await service
      .from('leave_requests')
      .select('employee_id, start_date, end_date, leave_types(is_paid)')
      .in('employee_id', empIds)
      .eq('status', 'approved')
      .gte('start_date', monthStart)
      .lt('start_date', nextMonthStart)

    // Build lookup maps
    const attendanceMap = (attendanceLogs ?? []).reduce<Record<string, { present: number; absent: number; late: number }>>((acc, log) => {
      if (!acc[log.employee_id]) acc[log.employee_id] = { present: 0, absent: 0, late: 0 }
      if (log.status === 'present') acc[log.employee_id].present++
      else if (log.status === 'absent') acc[log.employee_id].absent++
      else if (log.status === 'late') acc[log.employee_id].late++
      return acc
    }, {})

    const hrCommissionMap = (hrCommissions ?? []).reduce<Record<string, number>>((acc, c) => {
      acc[c.employee_id] = (acc[c.employee_id] ?? 0) + Number(c.triggered_commission)
      return acc
    }, {})

    // Map CRM commissions by user_id → employee_id
    const userToEmployee = employees.reduce<Record<string, string>>((acc, e) => {
      if (e.user_id) acc[e.user_id] = e.id
      return acc
    }, {})
    const crmCommissionMap = (crmCommissions ?? []).reduce<Record<string, number>>((acc, c) => {
      const empId = userToEmployee[c.agent_id]
      if (empId) acc[empId] = (acc[empId] ?? 0) + Number(c.amount)
      return acc
    }, {})

    const unpaidLeaveDaysMap = (leaveRequests ?? []).reduce<Record<string, number>>((acc, lr) => {
      const leaveType = Array.isArray(lr.leave_types) ? lr.leave_types[0] : lr.leave_types
      if (leaveType && (leaveType as { is_paid?: boolean }).is_paid === false) {
        const start = new Date(lr.start_date)
        const end = new Date(lr.end_date)
        const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)
        acc[lr.employee_id] = (acc[lr.employee_id] ?? 0) + days
      }
      return acc
    }, {})

    let processed = 0
    for (const emp of employees) {
      const basicSalary = Number(emp.basic_salary ?? emp.base_salary ?? 0)
      const attendance = attendanceMap[emp.id] ?? { present: 0, absent: 0, late: 0 }
      const dailyRate = workingDays > 0 ? basicSalary / workingDays : 0

      // Commissions from both sources
      const totalCommissions = (hrCommissionMap[emp.id] ?? 0) + (crmCommissionMap[emp.id] ?? 0)

      // Allowances / bonus / overtime (global defaults for this run)
      const allowances = globalAllowances
      const bonus = globalBonus
      const overtimeAmount = globalOvertime

      // Work-time deductions
      const absenceDeduction = attendance.absent * dailyRate
      const lateDeduction = Math.min(attendance.late * (dailyRate * 0.25), dailyRate * 2)

      // Unpaid leave
      const unpaidLeaveDays = unpaidLeaveDaysMap[emp.id] ?? 0
      const unpaidLeaveDeduct = unpaidLeaveDays * dailyRate

      const totalDeductions = absenceDeduction + lateDeduction + unpaidLeaveDeduct

      // Gross = all positive components
      const grossSalary = basicSalary + allowances + bonus + overtimeAmount + totalCommissions

      // Social insurance on basic salary only
      const socialInsEmp = basicSalary * SOCIAL_INS_RATE

      // Egyptian income tax (monthly = annual/12)
      const monthlyNetBeforeTax = grossSalary - totalDeductions - socialInsEmp
      const annualTaxable = Math.max(0, monthlyNetBeforeTax * 12)
      const taxAmount = calcEgyptianTax(annualTaxable) / 12

      const netSalary = Math.max(0, grossSalary - totalDeductions - socialInsEmp - taxAmount)

      await service.from('payroll').upsert({
        employee_id: emp.id,
        company_id: companyId,
        month,
        year,
        basic_salary: basicSalary,
        allowances,
        bonus,
        overtime_amount: overtimeAmount,
        present_days: attendance.present,
        absent_days: attendance.absent,
        late_count: attendance.late,
        total_commissions: totalCommissions,
        deductions: totalDeductions,
        unpaid_leave_days: unpaidLeaveDays,
        unpaid_leave_deduct: unpaidLeaveDeduct,
        social_ins_emp: socialInsEmp,
        tax_amount: taxAmount,
        gross_salary: grossSalary,
        net_salary: netSalary,
        working_days: workingDays,
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

export async function markAsPaidAction(
  month: number,
  year: number,
  companyId: string,
): Promise<PayrollActionState> {
  try {
    const session = await requireSession()
    if (!PAYROLL_RUN_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بتسجيل الدفع.' }
    }

    const service = createServiceRoleClient()
    const { error } = await service
      .from('payroll')
      .update({ status: 'paid' })
      .eq('company_id', companyId)
      .eq('month', month)
      .eq('year', year)
      .eq('status', 'approved')

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/payroll')
    return { ok: true, message: `تم تسجيل صرف مسيرة ${month}/${year}.` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر تسجيل الدفع.' }
  }
}
