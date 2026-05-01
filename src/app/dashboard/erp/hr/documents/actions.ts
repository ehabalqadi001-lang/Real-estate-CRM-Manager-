'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type DocActionState = { ok: boolean; message: string; url?: string }

const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function uploadDocumentAction(
  _prev: DocActionState,
  formData: FormData,
): Promise<DocActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح برفع الوثائق.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const employeeId = String(formData.get('employeeId') ?? '').trim()
    const docType    = String(formData.get('docType') ?? 'other').trim()
    const title      = String(formData.get('title') ?? '').trim()
    const notes      = String(formData.get('notes') ?? '').trim()
    const expiryDate = String(formData.get('expiryDate') ?? '').trim() || null
    const file       = formData.get('file') as File | null

    if (!employeeId || !title) {
      return { ok: false, message: 'يجب تحديد الموظف وعنوان الوثيقة.' }
    }

    let filePath: string | null = null
    let fileName: string | null = null
    let fileSizeBytes: number | null = null
    let mimeType: string | null = null

    if (file && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return { ok: false, message: 'حجم الملف تجاوز 10 ميغابايت.' }
      }
      if (!ALLOWED_MIME.includes(file.type)) {
        return { ok: false, message: 'نوع الملف غير مسموح. المسموح: PDF، صور، Word.' }
      }

      const ext = file.name.split('.').pop() ?? 'bin'
      const storagePath = `hr-docs/${companyId ?? 'global'}/${employeeId}/${Date.now()}-${docType}.${ext}`

      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await service.storage
        .from('documents')
        .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      filePath      = storagePath
      fileName      = file.name
      fileSizeBytes = file.size
      mimeType      = file.type
    }

    const { error } = await service.from('employee_documents').insert({
      company_id:      companyId,
      employee_id:     employeeId,
      doc_type:        docType,
      title,
      file_path:       filePath,
      file_name:       fileName,
      file_size_bytes: fileSizeBytes,
      mime_type:       mimeType,
      notes:           notes || null,
      expiry_date:     expiryDate,
      uploaded_by:     session.user.id,
    })

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/documents')
    revalidatePath(`/dashboard/erp/hr/employees`)
    return { ok: true, message: 'تم رفع الوثيقة بنجاح.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'حدث خطأ.' }
  }
}

export async function verifyDocumentAction(docId: string): Promise<DocActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح.' }
    }
    const service = createServiceRoleClient()
    const { error } = await service
      .from('employee_documents')
      .update({ verified: true, verified_by: session.user.id, verified_at: new Date().toISOString() })
      .eq('id', docId)
    if (error) throw error
    revalidatePath('/dashboard/erp/hr/documents')
    return { ok: true, message: 'تم التحقق من الوثيقة.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر التحقق.' }
  }
}

export async function deleteDocumentAction(docId: string, filePath: string | null): Promise<DocActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح بالحذف.' }
    }
    const service = createServiceRoleClient()

    if (filePath) {
      await service.storage.from('documents').remove([filePath])
    }
    const { error } = await service.from('employee_documents').delete().eq('id', docId)
    if (error) throw error

    revalidatePath('/dashboard/erp/hr/documents')
    return { ok: true, message: 'تم حذف الوثيقة.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر الحذف.' }
  }
}

export async function getDocumentUrlAction(filePath: string): Promise<DocActionState> {
  try {
    const service = createServiceRoleClient()
    const { data } = service.storage.from('documents').getPublicUrl(filePath)
    return { ok: true, message: '', url: data.publicUrl }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر الحصول على الرابط.' }
  }
}
