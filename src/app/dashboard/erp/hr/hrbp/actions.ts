'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type HRBPActionState = { ok: boolean; message: string }

const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

// Burnout score algorithm:
// Inputs (0–10 each): workload, overtime_hours (normalized), absence_days, late_checkins, missed_targets
// Weights: workload*0.25 + overtime*0.20 + absence*0.20 + late*0.15 + targets*0.20
export function calculateBurnoutScore({
  workloadScore,
  overtimeHours,
  absenceDays,
  lateCheckIns,
  missedTargetsPct,
}: {
  workloadScore: number
  overtimeHours: number
  absenceDays: number
  lateCheckIns: number
  missedTargetsPct: number
}): number {
  const overtime = Math.min(10, overtimeHours / 4)     // 40h/week overtime → 10
  const absence = Math.min(10, absenceDays * 1.5)      // 7 days → 10
  const late = Math.min(10, lateCheckIns * 1.0)        // 10 lates → 10
  const targets = Math.min(10, (missedTargetsPct / 10)) // 100% missed → 10
  return Math.round(
    workloadScore * 0.25 +
    overtime * 0.20 +
    absence * 0.20 +
    late * 0.15 +
    targets * 0.20
  )
}

export async function saveBurnoutIndicatorAction(
  _prev: HRBPActionState,
  formData: FormData,
): Promise<HRBPActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بتسجيل مؤشرات الإجهاد.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const employeeId = String(formData.get('employeeId') ?? '').trim()
    const periodMonth = Number(formData.get('periodMonth') ?? new Date().getMonth() + 1)
    const periodYear = Number(formData.get('periodYear') ?? new Date().getFullYear())
    const workloadScore = Number(formData.get('workloadScore') ?? 5)
    const overtimeHours = Number(formData.get('overtimeHours') ?? 0)
    const absenceDays = Number(formData.get('absenceDays') ?? 0)
    const lateCheckIns = Number(formData.get('lateCheckIns') ?? 0)
    const missedTargetsPct = Number(formData.get('missedTargetsPct') ?? 0)
    const hrNotes = String(formData.get('hrNotes') ?? '').trim()

    if (!employeeId) return { ok: false, message: 'يجب تحديد الموظف.' }

    const burnoutScore = calculateBurnoutScore({ workloadScore, overtimeHours, absenceDays, lateCheckIns, missedTargetsPct })
    const riskLevel = burnoutScore >= 7 ? 'high' : burnoutScore >= 4 ? 'medium' : 'low'

    const { error } = await service.from('burnout_indicators').upsert({
      company_id: companyId,
      employee_id: employeeId,
      period_month: periodMonth,
      period_year: periodYear,
      workload_score: workloadScore,
      overtime_hours: overtimeHours,
      absence_days: absenceDays,
      late_check_ins: lateCheckIns,
      missed_targets_pct: missedTargetsPct,
      burnout_score: burnoutScore,
      risk_level: riskLevel,
      hr_notes: hrNotes || null,
      recorded_by: session.user.id,
    }, { onConflict: 'employee_id,period_month,period_year' })

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/hrbp')
    return { ok: true, message: `مؤشر الإجهاد: ${burnoutScore}/10 — مستوى الخطر: ${riskLevel === 'high' ? 'عالٍ' : riskLevel === 'medium' ? 'متوسط' : 'منخفض'}` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.' }
  }
}

export async function saveEmployeePulseAction(
  _prev: HRBPActionState,
  formData: FormData,
): Promise<HRBPActionState> {
  try {
    const session = await requireSession()
    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const engagementScore = Number(formData.get('engagementScore') ?? 5)
    const satisfactionScore = Number(formData.get('satisfactionScore') ?? 5)
    const npsScore = Number(formData.get('npsScore') ?? 7)
    const comments = String(formData.get('comments') ?? '').trim()

    const { error } = await service.from('employee_pulse').insert({
      company_id: companyId,
      employee_id: session.user.id,
      engagement_score: engagementScore,
      satisfaction_score: satisfactionScore,
      nps_score: npsScore,
      comments: comments || null,
      submitted_at: new Date().toISOString(),
    })

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/hrbp')
    return { ok: true, message: 'شكراً! تم تسجيل تقييمك بنجاح وسيُحسب في مؤشرات الثقافة.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر تسجيل التقييم.' }
  }
}
