'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { calculateTieredCommission } from './utils'

export type CommissionActionState = { ok: boolean; message: string }

const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

export async function recordDealCommissionAction(
  _prev: CommissionActionState,
  formData: FormData,
): Promise<CommissionActionState> {
  try {
    const session = await requireSession()
    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const employeeId = String(formData.get('employeeId') ?? '').trim()
    const dealRef = String(formData.get('dealRef') ?? '').trim()
    const unitRef = String(formData.get('unitRef') ?? '').trim()
    const clientName = String(formData.get('clientName') ?? '').trim()
    const saleValue = Number(formData.get('saleValue') ?? 0)
    const collectedAmount = Number(formData.get('collectedAmount') ?? 0)
    const dealStage = String(formData.get('dealStage') ?? 'reservation')
    const notes = String(formData.get('notes') ?? '').trim()

    if (!employeeId || !dealRef || saleValue <= 0) {
      return { ok: false, message: 'يجب تحديد الموظف ورقم الصفقة وقيمة البيع.' }
    }

    const { data: employee } = await service
      .from('employees')
      .select('id, commission_rate, company_id')
      .eq('id', employeeId)
      .maybeSingle()

    if (!employee) return { ok: false, message: 'الموظف غير موجود.' }

    const commissionAmount = calculateTieredCommission(saleValue, employee.commission_rate)
    const collectionRatio = saleValue > 0 ? collectedAmount / saleValue : 0
    // Commission is triggered proportionally to collection ratio
    const triggeredCommission = commissionAmount * Math.min(collectionRatio, 1)

    const { error } = await service.from('commission_deals').insert({
      company_id: companyId,
      employee_id: employeeId,
      deal_ref: dealRef,
      unit_ref: unitRef || null,
      client_name: clientName || null,
      sale_value: saleValue,
      collected_amount: collectedAmount,
      commission_rate_pct: employee.commission_rate,
      commission_amount: commissionAmount,
      triggered_commission: triggeredCommission,
      deal_stage: dealStage,
      status: 'pending',
      notes: notes || null,
      recorded_by: session.user.id,
    })

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/commission')
    return { ok: true, message: `تم تسجيل الصفقة. العمولة المحتسبة: ${commissionAmount.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج.م` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.' }
  }
}

export async function approveCommissionAction(dealId: string): Promise<CommissionActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإقرار العمولات.' }
    }

    const service = createServiceRoleClient()
    const { error } = await service
      .from('commission_deals')
      .update({ status: 'approved', approved_by: session.user.id, approved_at: new Date().toISOString() })
      .eq('id', dealId)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/commission')
    return { ok: true, message: 'تمت الموافقة على العمولة.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر إقرار العمولة.' }
  }
}

export async function rejectCommissionAction(dealId: string, reason: string): Promise<CommissionActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك برفض العمولات.' }
    }

    const service = createServiceRoleClient()
    const { error } = await service
      .from('commission_deals')
      .update({ status: 'rejected', rejection_reason: reason, approved_by: session.user.id, approved_at: new Date().toISOString() })
      .eq('id', dealId)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/commission')
    return { ok: true, message: 'تم رفض العمولة.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر رفض العمولة.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync won CRM deals → commission_deals
// Reads deals with stage='Won' or 'Contracted' that haven't been imported yet,
// maps each to a commission_deals entry using the agent's commission_rate.
// Uses deal.id as deal_ref so re-running is idempotent (conflict → skip).
// ─────────────────────────────────────────────────────────────────────────────
export async function syncCRMDealsAction(): Promise<CommissionActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بالمزامنة.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    // Fetch won/contracted CRM deals with agent info
    let dealsQuery = service
      .from('deals')
      .select(`
        id, stage, final_price, created_at,
        assigned_to,
        leads!deals_lead_id_fkey(client_name)
      `)
      .in('stage', ['Won', 'Contracted', 'contract_signed', 'Handover'])
      .not('final_price', 'is', null)
      .gt('final_price', 0)
      .order('created_at', { ascending: false })
      .limit(200)

    if (companyId) dealsQuery = dealsQuery.eq('company_id', companyId)

    const { data: crmDeals, error: dealsError } = await dealsQuery
    if (dealsError) throw dealsError
    if (!crmDeals?.length) return { ok: true, message: 'لا توجد صفقات مكتملة لمزامنتها.' }

    // Fetch all agent employees with commission rates
    let empQuery = service
      .from('employees')
      .select('id, user_id, commission_rate')
      .eq('status', 'active')
    if (companyId) empQuery = empQuery.eq('company_id', companyId)
    const { data: employees } = await empQuery

    // Map user_id → employee
    const agentMap = new Map<string, { id: string; commission_rate: number | null }>()
    for (const emp of employees ?? []) {
      if (emp.user_id) agentMap.set(emp.user_id, { id: emp.id, commission_rate: emp.commission_rate })
    }

    // Fetch existing deal_refs to skip duplicates
    let existingQuery = service
      .from('commission_deals')
      .select('deal_ref')
    if (companyId) existingQuery = existingQuery.eq('company_id', companyId)
    const { data: existing } = await existingQuery
    const existingRefs = new Set((existing ?? []).map((e: { deal_ref: string }) => e.deal_ref))

    type CRMDeal = {
      id: string
      stage: string | null
      final_price: number | null
      created_at: string
      assigned_to: string | null
      leads: { client_name: string | null } | { client_name: string | null }[] | null
    }

    const toInsert = []
    for (const deal of crmDeals as unknown as CRMDeal[]) {
      const dealRef = deal.id
      if (existingRefs.has(dealRef)) continue

      const agentUserId = deal.assigned_to
      if (!agentUserId) continue

      const employee = agentMap.get(agentUserId)
      if (!employee) continue

      const saleValue = Number(deal.final_price ?? 0)
      if (saleValue <= 0) continue

      const commissionAmount = calculateTieredCommission(saleValue, employee.commission_rate)
      const leadsData = deal.leads
      const clientName = (Array.isArray(leadsData) ? leadsData[0] : leadsData)?.client_name ?? null

      toInsert.push({
        company_id: companyId,
        employee_id: employee.id,
        deal_ref: dealRef,
        client_name: clientName,
        sale_value: saleValue,
        collected_amount: saleValue,
        commission_rate_pct: employee.commission_rate,
        commission_amount: commissionAmount,
        triggered_commission: commissionAmount,
        deal_stage: deal.stage === 'Won' ? 'handover' : 'contract',
        status: 'pending',
        notes: `مستورد من CRM — مرحلة: ${deal.stage}`,
        recorded_by: session.user.id,
      })
    }

    if (!toInsert.length) {
      return { ok: true, message: 'كل الصفقات المكتملة مستوردة بالفعل — لا جديد.' }
    }

    const { error: insertError } = await service.from('commission_deals').insert(toInsert)
    if (insertError) throw insertError

    revalidatePath('/dashboard/erp/hr/commission')
    return { ok: true, message: `تمت مزامنة ${toInsert.length} صفقة جديدة من CRM بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذرت المزامنة.' }
  }
}
