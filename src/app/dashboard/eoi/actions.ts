'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type EOIActionState = { ok: boolean; message: string }

const CREATE_ALLOWED: AppRole[] = [
  'super_admin', 'platform_admin', 'company_owner', 'company_admin',
  'branch_manager', 'senior_agent', 'sales_director', 'team_leader',
  'account_manager', 'agent',
]
const REVIEW_ALLOWED: AppRole[] = [
  'super_admin', 'platform_admin', 'company_owner', 'company_admin',
  'sales_director', 'branch_manager',
]

export async function createEOIAction(
  _prev: EOIActionState,
  formData: FormData,
): Promise<EOIActionState> {
  try {
    const session = await requireSession()
    if (!CREATE_ALLOWED.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بإنشاء خطابات نية.' }
    }

    const service   = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const clientName  = String(formData.get('clientName')  ?? '').trim()
    const clientPhone = String(formData.get('clientPhone') ?? '').trim()
    const clientEmail = String(formData.get('clientEmail') ?? '').trim()
    const unitId      = String(formData.get('unitId')      ?? '').trim() || null
    const amount      = formData.get('amount') ? Number(formData.get('amount')) : null
    const notes       = String(formData.get('notes')       ?? '').trim()
    const expiryDays  = Number(formData.get('expiryDays')  ?? 7)

    if (!clientName) return { ok: false, message: 'اسم العميل مطلوب.' }

    const year = new Date().getFullYear()
    const { count } = await service
      .from('eoi_requests')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', `${year}-01-01`)

    const seq       = String((count ?? 0) + 1).padStart(4, '0')
    const eoiNumber = `EOI-${year}-${seq}`

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryDays)

    const { error } = await service.from('eoi_requests').insert({
      company_id:  companyId,
      eoi_number:  eoiNumber,
      client_name: clientName,
      client_phone: clientPhone || null,
      client_email: clientEmail || null,
      unit_id:     unitId,
      agent_id:    session.profile.id,
      amount,
      notes:       notes || null,
      expiry_date: expiryDate.toISOString(),
      status:      'pending',
    })
    if (error) throw error

    revalidatePath('/dashboard/eoi')
    return { ok: true, message: `تم إنشاء خطاب النية ${eoiNumber} بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function updateEOIStatusAction(
  _prev: EOIActionState,
  formData: FormData,
): Promise<EOIActionState> {
  try {
    const session = await requireSession()
    if (!REVIEW_ALLOWED.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بتحديث حالة خطاب النية.' }
    }

    const service = createServiceRoleClient()
    const eoiId   = String(formData.get('eoiId')  ?? '').trim()
    const status  = String(formData.get('status') ?? '').trim()

    if (!eoiId || !status) return { ok: false, message: 'البيانات المطلوبة غير مكتملة.' }

    const validStatuses = ['approved', 'rejected', 'converted', 'expired']
    if (!validStatuses.includes(status)) {
      return { ok: false, message: 'حالة غير صالحة.' }
    }

    const { error } = await service
      .from('eoi_requests')
      .update({ status })
      .eq('id', eoiId)
    if (error) throw error

    revalidatePath('/dashboard/eoi')
    const labels: Record<string, string> = {
      approved:  'اعتماد',
      rejected:  'رفض',
      converted: 'تحويل',
      expired:   'انتهاء',
    }
    return { ok: true, message: `تم ${labels[status] ?? 'تحديث'} خطاب النية بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}
