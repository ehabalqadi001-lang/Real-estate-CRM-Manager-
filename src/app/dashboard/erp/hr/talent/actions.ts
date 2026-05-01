'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'

export type TalentActionState = { ok: boolean; message: string }

const HR_WRITE_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer']

export async function addCandidateAction(
  _prev: TalentActionState,
  formData: FormData,
): Promise<TalentActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإضافة مرشحين.' }
    }

    const service = createServiceRoleClient()
    const companyId = session.profile.company_id ?? session.profile.tenant_id

    const fullName = String(formData.get('fullName') ?? '').trim()
    const phone = String(formData.get('phone') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const appliedRole = String(formData.get('appliedRole') ?? '').trim()
    const currentCompany = String(formData.get('currentCompany') ?? '').trim()
    const experienceYears = Number(formData.get('experienceYears') ?? 0)
    const expectedSalary = Number(formData.get('expectedSalary') ?? 0)
    const sourceChannel = String(formData.get('sourceChannel') ?? 'manual')
    const notes = String(formData.get('notes') ?? '').trim()

    if (!fullName || !appliedRole) {
      return { ok: false, message: 'اسم المرشح والمنصب المطلوب مطلوبان.' }
    }

    const { error } = await service.from('talent_candidates').insert({
      company_id: companyId,
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      applied_role: appliedRole,
      current_company: currentCompany || null,
      experience_years: experienceYears,
      expected_salary: expectedSalary || null,
      source_channel: sourceChannel,
      pipeline_stage: 'new',
      status: 'active',
      notes: notes || null,
      added_by: session.user.id,
    })

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/talent')
    return { ok: true, message: `تم إضافة ${fullName} إلى مجمع المواهب بنجاح.` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع.' }
  }
}

export async function advancePipelineAction(
  candidateId: string,
  nextStage: string,
): Promise<TalentActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بتقديم المرشحين.' }
    }

    const service = createServiceRoleClient()
    const { error } = await service
      .from('talent_candidates')
      .update({
        pipeline_stage: nextStage,
        stage_updated_at: new Date().toISOString(),
        stage_updated_by: session.user.id,
      })
      .eq('id', candidateId)

    if (error) throw error

    revalidatePath('/dashboard/erp/hr/talent')
    return { ok: true, message: 'تم تحديث مرحلة المرشح.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر تحديث المرحلة.' }
  }
}

export async function generateOfferLetterAction(candidateId: string): Promise<TalentActionState> {
  try {
    const session = await requireSession()
    if (!HR_WRITE_ROLES.includes(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإصدار خطابات العروض.' }
    }

    const service = createServiceRoleClient()

    const { data: candidate } = await service
      .from('talent_candidates')
      .select('*')
      .eq('id', candidateId)
      .maybeSingle()

    if (!candidate) return { ok: false, message: 'المرشح غير موجود.' }

    const offerDate = new Date().toISOString().slice(0, 10)
    const offerRef = `OFFER-FI-${new Date().getFullYear()}-${candidateId.slice(0, 6).toUpperCase()}`

    const offerContent = generateOfferContent({
      candidateName: candidate.full_name,
      appliedRole: candidate.applied_role,
      expectedSalary: candidate.expected_salary,
      offerDate,
      offerRef,
    })

    const { error } = await service.from('offer_letters').insert({
      company_id: candidate.company_id,
      candidate_id: candidateId,
      offer_ref: offerRef,
      candidate_name: candidate.full_name,
      applied_role: candidate.applied_role,
      offered_salary: candidate.expected_salary,
      offer_date: offerDate,
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      content: offerContent,
      status: 'draft',
      created_by: session.user.id,
    })

    if (error) throw error

    await service
      .from('talent_candidates')
      .update({ pipeline_stage: 'offer_sent' })
      .eq('id', candidateId)

    revalidatePath('/dashboard/erp/hr/talent')
    return { ok: true, message: `تم إنشاء خطاب العرض ${offerRef} بنجاح.` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر إصدار خطاب العرض.' }
  }
}

function generateOfferContent({
  candidateName,
  appliedRole,
  expectedSalary,
  offerDate,
  offerRef,
}: {
  candidateName: string
  appliedRole: string
  expectedSalary: number | null
  offerDate: string
  offerRef: string
}) {
  const salaryLine = expectedSalary
    ? `الراتب الشهري المعروض: ${expectedSalary.toLocaleString('ar-EG')} ج.م`
    : 'الراتب: يُحدد وفق السياسة الداخلية للشركة'

  return `
شركة FAST INVESTMENT للاستثمار العقاري
خطاب عرض وظيفة
رقم المرجع: ${offerRef}
التاريخ: ${offerDate}

السيد/ة الفاضل/ة: ${candidateName}

يسعدنا إبلاغكم بقبول انضمامكم إلى فريق شركة FAST INVESTMENT للاستثمار العقاري في منصب:
${appliedRole}

تفاصيل العرض:
- ${salaryLine}
- نظام عمولات متدرج على المبيعات
- مزايا وظيفية كاملة وفق سياسة الشركة
- فترة تجريبية: 3 أشهر

يُرجى الرد على هذا العرض خلال 7 أيام عمل من تاريخه.

مع أطيب التحيات،
قسم الموارد البشرية — FAST INVESTMENT
`.trim()
}
