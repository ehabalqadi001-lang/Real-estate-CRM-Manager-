'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { isManagerRole, isSuperAdmin } from '@/shared/auth/types'

export type PartnerActionState = {
  success: boolean
  message: string
}

type UploadedDocument = {
  name: string
  path: string
  type: string
  size: number
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0)
  return Number.isFinite(value) ? value : 0
}

function fileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
}

function assertManager(role: string) {
  if (!isManagerRole(role) && !isSuperAdmin(role) && role !== 'account_manager') {
    throw new Error('غير مصرح بهذا الإجراء')
  }
}

async function createServiceNotification(input: {
  userId: string
  title: string
  message: string
  link: string
  type?: string
}) {
  const service = createServiceRoleClient()
  const { error } = await service.from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    body: input.message,
    link: input.link,
    type: input.type ?? 'info',
    company_id: null,
    is_read: false,
  })
  if (error) {
    console.error('Failed to create BRM notification', error.message)
  }
}

async function uploadSalesDocuments(formData: FormData, folder: string) {
  const files = formData
    .getAll('documents')
    .filter((file): file is File => file instanceof File && file.size > 0)
    .slice(0, 10)

  const service = createServiceRoleClient()
  const uploaded: UploadedDocument[] = []

  for (const file of files) {
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExtension(file)}`
    const { data, error } = await service.storage.from('documents').upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (error) throw new Error(`تعذر رفع المستند: ${error.message}`)
    uploaded.push({ name: file.name, path: data.path, type: file.type, size: file.size })
  }

  return uploaded
}

export async function reviewPartnerApplication(formData: FormData) {
  const session = await requireSession()
  assertManager(session.profile.role)
  const service = createServiceRoleClient()

  const applicationId = text(formData, 'applicationId')
  const decision = text(formData, 'decision')
  const reason = text(formData, 'reason')

  if (!applicationId || !['approved', 'rejected', 'needs_info'].includes(decision)) {
    throw new Error('قرار مراجعة غير صالح')
  }

  const { data: application, error: appError } = await service
    .from('partner_applications')
    .select('id, profile_id, applicant_type, company_id, full_name, company_name')
    .eq('id', applicationId)
    .maybeSingle()

  if (appError) throw new Error(appError.message)
  if (!application) throw new Error('طلب الشريك غير موجود')

  const approved = decision === 'approved'
  const rejected = decision === 'rejected'
  const profileStatus = approved ? 'active' : rejected ? 'rejected' : 'pending'
  const verificationStatus = approved ? 'verified' : rejected ? 'rejected' : 'under_review'

  const { error } = await service
    .from('partner_applications')
    .update({
      status: decision,
      brm_stage: approved ? 'active_seller' : rejected ? 'application_review' : 'application_review',
      review_reason: reason || null,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) throw new Error(error.message)

  const [profileUpdate, userProfileUpdate, brokerUpdate] = await Promise.all([
    service.from('profiles').update({
      status: profileStatus,
      is_active: approved,
    }).eq('id', application.profile_id),
    service.from('user_profiles').update({
      status: profileStatus,
    }).eq('id', application.profile_id),
    service.from('broker_profiles').upsert({
      profile_id: application.profile_id,
      company_id: application.company_id ?? null,
      display_name: application.full_name || application.company_name || null,
      verification_status: verificationStatus,
      verified_by: approved ? session.user.id : null,
      verified_at: approved ? new Date().toISOString() : null,
      rejection_reason: rejected ? reason || 'تم رفض الطلب' : null,
      onboarding_completed: approved,
    }, { onConflict: 'profile_id' }),
  ])

  if (profileUpdate.error) throw new Error(profileUpdate.error.message)
  if (userProfileUpdate.error) throw new Error(userProfileUpdate.error.message)
  if (brokerUpdate.error) throw new Error(brokerUpdate.error.message)

  await createServiceNotification({
    userId: application.profile_id,
    title: approved ? 'تم اعتماد حساب الشريك' : rejected ? 'تم رفض طلب الشراكة' : 'مطلوب استكمال بيانات الشراكة',
    message: approved
      ? 'تم اعتماد حسابك ويمكنك الآن رفع المبيعات من بوابة الشريك.'
      : reason || 'يرجى مراجعة حالة طلبك من بوابة الشريك.',
    link: approved ? '/broker-portal/sales' : '/broker-portal/profile',
    type: approved ? 'success' : rejected ? 'error' : 'warning',
  })

  revalidatePath('/dashboard/partners')
  revalidatePath('/dashboard/brokers')
  revalidatePath('/broker-portal')
}

export async function assignPartnerAccountManager(formData: FormData) {
  const result = await assignPartnerAccountManagerCore(formData)
  if (!result.success) throw new Error(result.message)
  return result
}

export async function assignPartnerAccountManagerState(
  _prevState: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  try {
    return await assignPartnerAccountManagerCore(formData)
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'تعذر تحديث Account Manager',
    }
  }
}

async function assignPartnerAccountManagerCore(formData: FormData): Promise<PartnerActionState> {
  const session = await requireSession()
  assertManager(session.profile.role)
  const service = createServiceRoleClient()

  const applicationId = text(formData, 'applicationId')
  const accountManagerId = text(formData, 'accountManagerId')
  if (!applicationId || !accountManagerId) throw new Error('بيانات التعيين غير مكتملة')
  const [{ data: application, error: appError }, { data: manager, error: managerError }] = await Promise.all([
    service
      .from('partner_applications')
      .select('id, profile_id, full_name, company_name')
      .eq('id', applicationId)
      .maybeSingle(),
    service
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', accountManagerId)
      .maybeSingle(),
  ])

  if (appError) throw new Error(appError.message)
  if (managerError) throw new Error(managerError.message)
  if (!application) throw new Error('طلب الشريك غير موجود')
  if (!manager) throw new Error('Account Manager غير موجود')
  if (!applicationId || !accountManagerId) throw new Error('بيانات التعيين غير مكتملة')

  const [{ error }, { error: profileError }, { error: salesError }] = await Promise.all([
    service
      .from('partner_applications')
      .update({ assigned_account_manager_id: accountManagerId })
      .eq('id', applicationId),
    service
      .from('user_profiles')
      .update({ account_manager_id: accountManagerId })
      .eq('id', application.profile_id),
    service
      .from('broker_sales_submissions')
      .update({ assigned_account_manager_id: accountManagerId })
      .eq('broker_user_id', application.profile_id)
      .in('status', ['draft', 'submitted', 'under_review', 'approved']),
  ])

  if (error) throw new Error(error.message)
  if (profileError) throw new Error(profileError.message)
  if (salesError) throw new Error(salesError.message)
  await createServiceNotification({
    userId: accountManagerId,
    title: 'تم تعيين طلب شريك لك',
    message: 'يوجد طلب شريك جديد ضمن مسؤوليتك للمراجعة والمتابعة.',
    link: '/dashboard/partners',
    type: 'info',
  })
  revalidatePath('/dashboard/partners')
  revalidatePath('/broker-portal/sales')
  return {
    success: true,
    message: `تم تعيين ${manager.full_name || manager.email || 'Account Manager'} بنجاح`,
  }
}

export async function submitBrokerSale(formData: FormData) {
  const session = await requireSession()
  const service = createServiceRoleClient()

  const { data: brokerProfile, error: brokerError } = await service
    .from('broker_profiles')
    .select('id, profile_id, company_id, verification_status, bank_name, bank_account_name, bank_account_number, bank_iban, developer_commission_rate, broker_commission_rate')
    .eq('profile_id', session.user.id)
    .maybeSingle()

  if (brokerError) throw new Error(brokerError.message)
  if (!brokerProfile) throw new Error('ملف الوسيط غير موجود')
  if (brokerProfile.verification_status !== 'verified') throw new Error('يجب اعتماد حساب الشريك قبل رفع المبيعات')

  const { data: applicationAssignment } = await service
    .from('partner_applications')
    .select('assigned_account_manager_id')
    .eq('profile_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const developerId = text(formData, 'developerId') || null
  const projectId = text(formData, 'projectId') || null
  const dealValue = numberValue(formData, 'dealValue')

  // Commission lookup priority:
  // 1. Partner exception — project-specific
  // 2. Partner exception — developer-wide
  // 3. Standard commission_rates — project-specific
  // 4. Standard commission_rates — developer-wide
  // 5. broker_profiles fallback rates
  let developerRate = Number(brokerProfile.developer_commission_rate ?? 4)
  let brokerRate = Number(brokerProfile.broker_commission_rate ?? 2)

  if (developerId) {
    // Check partner exceptions first
    const { data: exceptions } = await service
      .from('partner_commission_exceptions')
      .select('developer_commission_rate, broker_commission_rate, project_id')
      .eq('profile_id', session.user.id)
      .eq('developer_id', developerId)

    const projectEx = exceptions?.find((e) => e.project_id === projectId && projectId)
    const devEx = exceptions?.find((e) => !e.project_id)
    const ex = projectEx ?? devEx

    if (ex) {
      developerRate = Number(ex.developer_commission_rate)
      brokerRate = Number(ex.broker_commission_rate)
    } else {
      // Check standard commission_rates
      const { data: stdRates } = await service
        .from('commission_rates')
        .select('rate_percentage, agent_share_percentage, project_id')
        .eq('developer_id', developerId)
        .or(`project_id.eq.${projectId ?? 'null'},project_id.is.null`)
        .lte('min_value', dealValue)
        .or('max_value.is.null,max_value.gte.' + dealValue)
        .order('project_id', { ascending: false })
        .limit(1)

      const rate = stdRates?.[0]
      if (rate) {
        developerRate = Number(rate.rate_percentage)
        brokerRate = +(Number(rate.rate_percentage) * (Number(rate.agent_share_percentage) / 100)).toFixed(4)
      }
    }
  }

  const grossCommission = Math.round(dealValue * (developerRate / 100))
  const brokerCommission = Math.round(dealValue * (brokerRate / 100))
  const companyCommission = Math.max(grossCommission - brokerCommission, 0)
  const documents = await uploadSalesDocuments(formData, `broker-sales/${session.user.id}`)

  const { data: sale, error } = await service.from('broker_sales_submissions').insert({
    broker_profile_id: brokerProfile.id,
    broker_user_id: session.user.id,
    company_id: brokerProfile.company_id ?? session.profile.company_id ?? null,
    assigned_account_manager_id: applicationAssignment?.assigned_account_manager_id ?? null,
    client_name: text(formData, 'clientName'),
    client_phone: text(formData, 'clientPhone') || null,
    project_name: text(formData, 'projectName'),
    developer_name: text(formData, 'developerName') || null,
    developer_id: developerId,
    project_id: projectId,
    unit_code: text(formData, 'unitCode') || null,
    unit_type: text(formData, 'unitType') || null,
    deal_value: dealValue,
    developer_commission_rate: developerRate,
    broker_commission_rate: brokerRate,
    gross_commission: grossCommission,
    broker_commission_amount: brokerCommission,
    company_commission_amount: companyCommission,
    stage: text(formData, 'stage') || 'eoi',
    status: 'submitted',
    documents,
    payout_method: text(formData, 'payoutMethod') || 'bank_transfer',
    bank_details: {
      bankName: text(formData, 'bankName') || brokerProfile.bank_name,
      accountName: text(formData, 'bankAccountName') || brokerProfile.bank_account_name,
      accountNumber: text(formData, 'bankAccountNumber') || brokerProfile.bank_account_number,
      iban: text(formData, 'bankIban') || brokerProfile.bank_iban,
    },
    notes: text(formData, 'notes') || null,
  }).select('id').single()

  if (error) throw new Error(error.message)

  if (sale?.id && documents.length > 0) {
    await service.from('broker_sale_documents').insert(documents.map((document) => ({
      sale_submission_id: sale.id,
      broker_user_id: session.user.id,
      company_id: brokerProfile.company_id ?? session.profile.company_id ?? null,
      document_type: 'sale_document',
      name: document.name,
      url: document.path,
      file_size: document.size,
      mime_type: document.type,
      status: 'pending',
    })))
  }

  const { data: managers } = await service
    .from('profiles')
    .select('id')
    .in('role', ['account_manager', 'users_am', 'am_supervisor', 'company_admin', 'branch_manager'])
    .limit(100)

  await Promise.all((managers ?? []).map((manager) => createServiceNotification({
    userId: manager.id,
    title: 'بيع جديد من شريك',
    message: `${text(formData, 'projectName')} - ${text(formData, 'clientName')}`,
    link: sale?.id ? `/dashboard/partners/sales/${sale.id}` : '/dashboard/partners',
    type: 'info',
  })))

  revalidatePath('/broker-portal/sales')
  revalidatePath('/dashboard/partners')
}

export async function reviewBrokerSale(formData: FormData) {
  const session = await requireSession()
  assertManager(session.profile.role)
  const service = createServiceRoleClient()

  const saleId = text(formData, 'saleId')
  const decision = text(formData, 'decision')
  const reason = text(formData, 'reason')
  if (!saleId || !['approved', 'rejected'].includes(decision)) throw new Error('قرار غير صالح')

  const { data: sale, error: saleError } = await service
    .from('broker_sales_submissions')
    .select('*')
    .eq('id', saleId)
    .maybeSingle()

  if (saleError) throw new Error(saleError.message)
  if (!sale) throw new Error('طلب البيع غير موجود')

  if (decision === 'rejected') {
    const { error } = await service.from('broker_sales_submissions').update({
      status: 'rejected',
      commission_lifecycle_stage: 'rejected',
      rejection_reason: reason || 'تم رفض البيع',
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', saleId)
    if (error) throw new Error(error.message)
    await createServiceNotification({
      userId: sale.broker_user_id,
      title: 'تم رفض البيع',
      message: reason || 'تم رفض البيع المرفوع. راجع السبب من سجل المبيعات.',
      link: '/broker-portal/sales',
      type: 'error',
    })
    revalidatePath('/dashboard/partners')
    revalidatePath('/broker-portal/sales')
    return
  }

  // Create deal record so the sale appears in /dashboard/deals and /dashboard/contracts
  const dealStage = sale.stage === 'contract' ? 'Contracted' : 'Won'
  const { data: deal } = await service.from('deals').insert({
    title: `شريك - ${sale.client_name} - ${sale.project_name}`,
    client_name: sale.client_name,
    lead_id: null,
    unit_id: null,
    agent_id: sale.broker_user_id,
    company_id: sale.company_id,
    final_price: sale.deal_value,
    unit_value: sale.deal_value,
    value: sale.deal_value,
    amount: sale.deal_value,
    discount: 0,
    stage: dealStage,
    status: 'won',
    contract_signed_at: new Date().toISOString(),
  }).select('id').maybeSingle()

  const { data: commission, error: commissionError } = await service.from('commissions').insert({
    deal_id: deal?.id ?? null,
    agent_id: sale.broker_user_id,
    company_id: sale.company_id,
    amount: sale.broker_commission_amount,
    total_amount: sale.gross_commission,
    deal_value: sale.deal_value,
    percentage: sale.broker_commission_rate,
    commission_rate: sale.broker_commission_rate,
    gross_deal_value: sale.deal_value,
    gross_commission: sale.gross_commission,
    agent_amount: sale.broker_commission_amount,
    company_amount: sale.company_commission_amount ?? 0,
    commission_type: 'broker_partner',
    status: 'approved',
    lifecycle_stage: 'approved',
    broker_sale_submission_id: saleId,
    beneficiary_name: sale.client_name,
    bank_details: JSON.stringify(sale.bank_details ?? {}),
    notes: `BRM ${sale.project_name} - ${sale.stage}`,
    approved_by: session.user.id,
    approved_at: new Date().toISOString(),
    country_code: 'EG',
  }).select('id').single()

  if (commissionError) throw new Error(commissionError.message)

  const { error } = await service.from('broker_sales_submissions').update({
    status: 'approved',
    commission_lifecycle_stage: 'sale_approved',
    reviewed_by: session.user.id,
    reviewed_at: new Date().toISOString(),
    commission_id: commission.id,
  }).eq('id', saleId)

  if (error) throw new Error(error.message)
  await createServiceNotification({
    userId: sale.broker_user_id,
    title: 'تم اعتماد البيع وإنشاء العمولة',
    message: `تم اعتماد بيع ${sale.project_name} وإضافة العمولة إلى حسابك.`,
    link: '/broker-portal/commissions',
    type: 'success',
  })
  revalidatePath('/dashboard/partners')
  revalidatePath('/dashboard/deals')
  revalidatePath('/dashboard/contracts')
  revalidatePath('/dashboard/commissions')
  revalidatePath('/broker-portal/sales')
  revalidatePath('/broker-portal/commissions')
}

export async function updateBrokerSaleLifecycle(formData: FormData) {
  const session = await requireSession()
  assertManager(session.profile.role)
  const service = createServiceRoleClient()

  const saleId = text(formData, 'saleId')
  const lifecycle = text(formData, 'lifecycle')
  const payoutDate = text(formData, 'brokerPayoutDueDate')
  const paymentReference = text(formData, 'paymentReference')

  const lifecycleMap: Record<string, string> = {
    claim_submitted_to_developer: 'claim_submitted_to_developer',
    developer_commission_collected: 'developer_commission_collected',
    broker_payout_scheduled: 'broker_payout_scheduled',
    broker_paid: 'broker_paid',
  }

  if (!saleId || !lifecycleMap[lifecycle]) throw new Error('مرحلة غير صالحة')

  const now = new Date().toISOString()
  const salePatch: Record<string, unknown> = { commission_lifecycle_stage: lifecycle }
  const commissionPatch: Record<string, unknown> = { lifecycle_stage: lifecycleMap[lifecycle] }

  if (lifecycle === 'claim_submitted_to_developer') {
    salePatch.developer_claim_submitted_at = now
    commissionPatch.developer_claim_submitted_at = now
  }
  if (lifecycle === 'developer_commission_collected') {
    salePatch.developer_collected_at = now
    commissionPatch.developer_collected_at = now
    commissionPatch.collected_amount = numberValue(formData, 'collectedAmount')
  }
  if (lifecycle === 'broker_payout_scheduled') {
    salePatch.broker_payout_due_date = payoutDate || null
    commissionPatch.broker_payout_due_date = payoutDate || null
    commissionPatch.status = 'processing'
  }
  if (lifecycle === 'broker_paid') {
    salePatch.broker_paid_at = now
    commissionPatch.broker_paid_at = now
    commissionPatch.paid_at = now
    commissionPatch.payment_date = now.slice(0, 10)
    commissionPatch.payment_reference = paymentReference || null
    commissionPatch.status = 'paid'
  }

  const { data: sale } = await service
    .from('broker_sales_submissions')
    .select('commission_id, broker_user_id, project_name, company_id')
    .eq('id', saleId)
    .maybeSingle()

  const { error } = await service.from('broker_sales_submissions').update(salePatch).eq('id', saleId)
  if (error) throw new Error(error.message)

  if (sale?.commission_id) {
    const { error: commissionError } = await service.from('commissions').update(commissionPatch).eq('id', sale.commission_id)
    if (commissionError) throw new Error(commissionError.message)
  }

  const lifecycleMessages: Record<string, string> = {
    claim_submitted_to_developer: 'تم تقديم مطالبة العمولة إلى المطور.',
    developer_commission_collected: 'تم تحصيل العمولة من المطور.',
    broker_payout_scheduled: payoutDate ? `تم تحديد موعد صرف عمولتك يوم ${payoutDate}.` : 'تم تحديد عمولتك ضمن دفعات الصرف.',
    broker_paid: 'تم صرف عمولتك. يرجى مراجعة سجل العمولات.',
  }

  if (sale?.broker_user_id) {
    await createServiceNotification({
      userId: sale.broker_user_id,
      title: 'تحديث مرحلة العمولة',
      message: lifecycleMessages[lifecycle] ?? `تم تحديث مرحلة عمولة ${sale.project_name}.`,
      link: '/broker-portal/commissions',
      type: lifecycle === 'broker_paid' ? 'success' : 'info',
    })
  }

  revalidatePath('/dashboard/partners')
  revalidatePath('/dashboard/commissions')
  revalidatePath('/broker-portal/sales')
  revalidatePath('/broker-portal/commissions')
}

export async function reviewBrokerSaleDocument(formData: FormData) {
  const session = await requireSession()
  assertManager(session.profile.role)
  const service = createServiceRoleClient()

  const documentId = text(formData, 'documentId')
  const saleId = text(formData, 'saleId')
  const decision = text(formData, 'decision')
  const reason = text(formData, 'reason')
  if (!documentId || !saleId || !['approved', 'rejected'].includes(decision)) throw new Error('قرار مستند غير صالح')

  const { data: document, error: docError } = await service
    .from('broker_sale_documents')
    .select('id, broker_user_id, company_id, name')
    .eq('id', documentId)
    .maybeSingle()

  if (docError) throw new Error(docError.message)
  if (!document) throw new Error('المستند غير موجود')

  const { error } = await service.from('broker_sale_documents').update({
    status: decision,
    reviewed_by: session.user.id,
    reviewed_at: new Date().toISOString(),
    rejection_reason: decision === 'rejected' ? reason || 'تم رفض المستند' : null,
  }).eq('id', documentId)

  if (error) throw new Error(error.message)

  const { data: docs } = await service
    .from('broker_sale_documents')
    .select('status')
    .eq('sale_submission_id', saleId)

  const statuses = (docs ?? []).map((item) => item.status)
  const reviewStatus = statuses.length > 0 && statuses.every((status) => status === 'approved')
    ? 'approved'
    : statuses.some((status) => status === 'rejected')
      ? 'rejected'
      : statuses.some((status) => status === 'approved')
        ? 'partially_approved'
        : 'pending'

  await service.from('broker_sales_submissions').update({ documents_review_status: reviewStatus }).eq('id', saleId)

  await createServiceNotification({
    userId: document.broker_user_id,
    title: decision === 'approved' ? 'تم اعتماد مستند بيع' : 'تم رفض مستند بيع',
    message: decision === 'approved' ? `تم اعتماد المستند: ${document.name}` : reason || `تم رفض المستند: ${document.name}`,
    link: '/broker-portal/sales',
    type: decision === 'approved' ? 'success' : 'warning',
  })

  revalidatePath(`/dashboard/partners/sales/${saleId}`)
  revalidatePath('/dashboard/partners')
  revalidatePath('/broker-portal/sales')
}
