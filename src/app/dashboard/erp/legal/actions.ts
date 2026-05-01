'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type LegalActionState = { ok: boolean; message: string }

const ALLOWED_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'company_admin', 'company_owner', 'hr_manager', 'hr_staff']

export async function createLegalDocumentAction(
  _prev: LegalActionState,
  formData: FormData,
): Promise<LegalActionState> {
  try {
    const session = await requireSession()
    if (!ALLOWED_ROLES.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بإنشاء وثائق قانونية.' }
    }
    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const title        = String(formData.get('title') ?? '').trim()
    const documentType = String(formData.get('documentType') ?? 'other').trim()
    const status       = String(formData.get('status') ?? 'draft').trim()
    const notes        = String(formData.get('notes') ?? '').trim()

    if (!title) return { ok: false, message: 'عنوان الوثيقة مطلوب.' }

    const { error } = await service.from('legal_documents').insert({
      company_id:    companyId,
      title,
      document_type: documentType,
      status,
      notes:         notes || null,
      generated_by:  session.user.id,
    })
    if (error) throw error

    revalidatePath('/dashboard/erp/legal')
    return { ok: true, message: 'تم إنشاء الوثيقة بنجاح.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function createHRContractAction(
  _prev: LegalActionState,
  formData: FormData,
): Promise<LegalActionState> {
  try {
    const session = await requireSession()
    if (!ALLOWED_ROLES.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح بإنشاء عقود.' }
    }
    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const employeeId    = String(formData.get('employeeId') ?? '').trim()
    const title         = String(formData.get('title') ?? '').trim()
    const contractType  = String(formData.get('contractType') ?? 'employment').trim()
    const startDate     = String(formData.get('startDate') ?? '').trim()
    const endDate       = String(formData.get('endDate') ?? '').trim() || null
    const isPermanent   = formData.get('isPermanent') === 'true'
    const notes         = String(formData.get('notes') ?? '').trim()

    if (!employeeId || !title || !startDate) {
      return { ok: false, message: 'الموظف، العنوان، وتاريخ البدء مطلوبة.' }
    }

    const { count } = await service
      .from('hr_contracts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
    const seq = String((count ?? 0) + 1).padStart(4, '0')
    const contractNumber = `CTR-${new Date().getFullYear()}-${seq}`

    const { error } = await service.from('hr_contracts').insert({
      company_id:      companyId,
      employee_id:     employeeId,
      title,
      contract_type:   contractType,
      contract_number: contractNumber,
      start_date:      startDate,
      end_date:        isPermanent ? null : endDate,
      is_permanent:    isPermanent,
      notes:           notes || null,
      created_by:      session.user.id,
    })
    if (error) throw error

    revalidatePath('/dashboard/erp/legal')
    return { ok: true, message: `تم إنشاء العقد ${contractNumber} بنجاح.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function updateDocumentStatusAction(docId: string, status: string): Promise<LegalActionState> {
  try {
    const session = await requireSession()
    if (!ALLOWED_ROLES.includes(session.profile.role as AppRole)) {
      return { ok: false, message: 'غير مصرح.' }
    }
    const service = createServiceRoleClient()
    const { error } = await service.from('legal_documents').update({ status }).eq('id', docId)
    if (error) throw error
    revalidatePath('/dashboard/erp/legal')
    return { ok: true, message: 'تم تحديث الحالة.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}
