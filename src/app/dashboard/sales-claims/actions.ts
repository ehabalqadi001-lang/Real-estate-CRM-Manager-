'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type ClaimActionState = { ok: boolean; message: string }

const CREATE_ALLOWED: AppRole[] = [
  'super_admin', 'platform_admin', 'company_owner', 'company_admin',
  'branch_manager', 'senior_agent', 'sales_director', 'team_leader',
  'account_manager', 'agent',
]
const REVIEW_ALLOWED: AppRole[] = [
  'super_admin', 'platform_admin', 'company_owner', 'company_admin',
  'sales_director', 'branch_manager',
]

export async function createSaleClaimAction(
  _prev: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  try {
    const session = await requireSession()
    if (!CREATE_ALLOWED.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بإنشاء مطالبات بيع.' }
    }

    const service   = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id
    const agentId   = session.profile.id

    const buyerName        = String(formData.get('buyerName')        ?? '').trim()
    const buyerPhone       = String(formData.get('buyerPhone')       ?? '').trim()
    const buyerEmail       = String(formData.get('buyerEmail')       ?? '').trim()
    const buyerNationalId  = String(formData.get('buyerNationalId')  ?? '').trim()
    const unitId           = String(formData.get('unitId')           ?? '').trim() || null
    const reservationId    = String(formData.get('reservationId')    ?? '').trim() || null
    const salePrice        = Number(formData.get('salePrice')        ?? 0)
    const downPayment      = formData.get('downPayment')   ? Number(formData.get('downPayment'))   : null
    const commissionRate   = formData.get('commissionRate') ? Number(formData.get('commissionRate')) : null
    const contractDate     = String(formData.get('contractDate')     ?? '').trim() || null
    const installmentYears = formData.get('installmentYears') ? Number(formData.get('installmentYears')) : null
    const notes            = String(formData.get('notes')            ?? '').trim()

    if (!buyerName) return { ok: false, message: 'اسم المشتري مطلوب.' }
    if (!salePrice || salePrice <= 0) return { ok: false, message: 'سعر البيع مطلوب ويجب أن يكون أكبر من صفر.' }

    const year = new Date().getFullYear()
    const { count } = await service
      .from('sale_claims')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', `${year}-01-01`)

    const seq         = String((count ?? 0) + 1).padStart(4, '0')
    const claimNumber = `CLM-${year}-${seq}`

    const commissionAmount = commissionRate != null
      ? Math.round(salePrice * commissionRate / 100)
      : null

    const { error } = await service.from('sale_claims').insert({
      claim_number:     claimNumber,
      company_id:       companyId,
      agent_id:         agentId,
      unit_id:          unitId,
      reservation_id:   reservationId,
      buyer_name:       buyerName,
      buyer_phone:      buyerPhone  || null,
      buyer_email:      buyerEmail  || null,
      buyer_national_id: buyerNationalId || null,
      sale_price:       salePrice,
      down_payment:     downPayment,
      commission_rate:  commissionRate,
      commission_amount: commissionAmount,
      contract_date:    contractDate,
      installment_years: installmentYears,
      notes:            notes || null,
      status:           'submitted',
    })
    if (error) throw error

    revalidatePath('/dashboard/sales-claims')
    return { ok: true, message: `تم رفع مطالبة البيع ${claimNumber} بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function reviewClaimAction(
  _prev: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  try {
    const session = await requireSession()
    if (!REVIEW_ALLOWED.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بمراجعة مطالبات البيع.' }
    }

    const service   = createServiceRoleClient()
    const claimId   = String(formData.get('claimId')     ?? '').trim()
    const newStatus = String(formData.get('status')      ?? '').trim()
    const notes     = String(formData.get('reviewNotes') ?? '').trim()

    if (!claimId) return { ok: false, message: 'معرّف المطالبة مطلوب.' }

    const allowed = ['under_review', 'approved', 'rejected']
    if (!allowed.includes(newStatus)) {
      return { ok: false, message: 'حالة غير صالحة.' }
    }

    const { data: claim } = await service
      .from('sale_claims')
      .select('status, unit_id')
      .eq('id', claimId)
      .single()

    if (!claim) return { ok: false, message: 'المطالبة غير موجودة.' }
    if (claim.status === 'approved' && newStatus !== 'paid') {
      return { ok: false, message: 'تم اعتماد هذه المطالبة مسبقاً.' }
    }

    await service
      .from('sale_claims')
      .update({
        status:      newStatus,
        reviewed_by: session.profile.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('id', claimId)

    // Mark unit as sold when claim is approved
    if (newStatus === 'approved' && claim.unit_id) {
      await service
        .from('inventory')
        .update({ status: 'sold' })
        .eq('id', claim.unit_id)
    }

    revalidatePath('/dashboard/sales-claims')
    const labels: Record<string, string> = {
      under_review: 'قيد المراجعة',
      approved:     'اعتماد',
      rejected:     'رفض',
    }
    return { ok: true, message: `تم ${labels[newStatus] ?? 'تحديث'} المطالبة بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function markClaimPaidAction(
  _prev: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  try {
    const session = await requireSession()
    if (!REVIEW_ALLOWED.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح.' }
    }

    const service = createServiceRoleClient()
    const claimId = String(formData.get('claimId') ?? '').trim()
    if (!claimId) return { ok: false, message: 'معرّف المطالبة مطلوب.' }

    const { data: claim } = await service
      .from('sale_claims')
      .select('status, commission_amount, agent_id, company_id')
      .eq('id', claimId)
      .single()

    if (!claim) return { ok: false, message: 'المطالبة غير موجودة.' }
    if (claim.status !== 'approved') {
      return { ok: false, message: 'يجب اعتماد المطالبة أولاً قبل صرف العمولة.' }
    }

    await service
      .from('sale_claims')
      .update({ status: 'paid', reviewed_at: new Date().toISOString() })
      .eq('id', claimId)

    revalidatePath('/dashboard/sales-claims')
    return { ok: true, message: 'تم تسجيل صرف العمولة بنجاح.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}
