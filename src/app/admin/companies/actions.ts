'use server'

import { revalidatePath } from 'next/cache'
import { sendCompanyApprovedEmail, sendCompanyInfoRequestedEmail, sendCompanyRejectedEmail } from '@/lib/email'
import { createRawClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

type CompanyEmailContext = {
  companyName: string
  ownerName: string
  email: string | null
}

async function getCompanyEmailContext(
  supabase: Awaited<ReturnType<typeof createRawClient>>,
  companyId: string,
): Promise<CompanyEmailContext> {
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, owner_id')
    .eq('id', companyId)
    .maybeSingle()

  const companyName = company?.name ?? 'شركتك'
  let owner: { full_name: string | null; email: string | null } | null = null

  if (company?.owner_id) {
    const { data } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', company.owner_id)
      .maybeSingle()
    owner = data
  }

  if (!owner?.email) {
    const { data } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('company_id', companyId)
      .eq('role', 'company_admin')
      .limit(1)
      .maybeSingle()
    owner = data
  }

  return {
    companyName,
    ownerName: owner?.full_name ?? owner?.email ?? 'عميلنا',
    email: owner?.email ?? null,
  }
}

export async function approveCompany(formData: FormData) {
  await requirePermission('admin.view')
  const id = String(formData.get('id') ?? '')
  const supabase = await createRawClient()
  const emailContext = await getCompanyEmailContext(supabase, id)
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('companies')
    .update({
      active: true,
      is_suspended: false,
      suspended_reason: null,
      onboarded_at: now,
      updated_at: now,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  if (emailContext.email) {
    await sendCompanyApprovedEmail({
      to: emailContext.email,
      ownerName: emailContext.ownerName,
      companyName: emailContext.companyName,
    })
  }

  revalidatePath('/admin/companies')
}

export async function rejectCompany(formData: FormData) {
  await requirePermission('admin.view')
  const id = String(formData.get('id') ?? '')
  const reason = String(formData.get('reason') ?? 'مرفوض من إدارة المنصة').trim() || 'مرفوض من إدارة المنصة'
  const supabase = await createRawClient()
  const emailContext = await getCompanyEmailContext(supabase, id)
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('companies')
    .update({
      active: false,
      is_suspended: true,
      suspended_reason: reason,
      suspended_at: now,
      updated_at: now,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  if (emailContext.email) {
    await sendCompanyRejectedEmail({
      to: emailContext.email,
      ownerName: emailContext.ownerName,
      companyName: emailContext.companyName,
      reason,
    })
  }

  revalidatePath('/admin/companies')
}

export async function suspendCompany(formData: FormData) {
  await requirePermission('admin.view')
  const id = String(formData.get('id') ?? '')
  const reason = String(formData.get('reason') ?? 'تعليق إداري').trim() || 'تعليق إداري'
  const supabase = await createRawClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('companies')
    .update({
      is_suspended: true,
      suspended_reason: reason,
      suspended_at: now,
      updated_at: now,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/companies')
}

export async function requestCompanyInfo(formData: FormData) {
  await requirePermission('admin.view')
  const id = String(formData.get('id') ?? '')
  const reason = String(formData.get('reason') ?? 'مطلوب استكمال بيانات أو وثائق الشركة').trim() || 'مطلوب استكمال بيانات أو وثائق الشركة'
  const supabase = await createRawClient()
  const emailContext = await getCompanyEmailContext(supabase, id)

  const { error } = await supabase
    .from('companies')
    .update({
      active: false,
      is_suspended: false,
      suspended_reason: `طلب استكمال بيانات: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  if (emailContext.email) {
    await sendCompanyInfoRequestedEmail({
      to: emailContext.email,
      ownerName: emailContext.ownerName,
      companyName: emailContext.companyName,
      reason,
    })
  }

  revalidatePath('/admin/companies')
}
