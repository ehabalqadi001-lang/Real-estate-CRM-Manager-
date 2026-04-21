'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { canAssignRole, canManageRole, canManageTeam, normalizeRole, type Role } from '@/lib/permissions'

interface TeamMemberPayload {
  email?: string
  password?: string
  fullName?: string
  phone?: string
}

type ActorProfile = {
  id: string
  role: Role
  companyId: string | null
  branchId: string | null
}

type MemberProfile = {
  id: string
  role: Role
  companyId: string | null
}

function isFormData(payload: TeamMemberPayload | FormData): payload is FormData {
  return typeof (payload as FormData).get === 'function'
}

export async function addTeamMember(payload: TeamMemberPayload | FormData) {
  const supabase = await createServerSupabaseClient()
  const actor = await requireTeamManager(supabase)

  const fd = isFormData(payload)
  const email = fd ? String(payload.get('email') ?? '') : payload.email ?? ''
  const password = (fd ? String(payload.get('password') ?? '') : payload.password) || crypto.randomUUID().slice(0, 12)
  const fullName = fd ? String(payload.get('fullName') ?? '') : payload.fullName ?? ''
  const phone = fd ? String(payload.get('phone') ?? '') : payload.phone ?? ''

  if (!email.trim()) return { success: false, error: 'البريد الإلكتروني مطلوب' }
  if (!actor.companyId && actor.role !== 'super_admin') return { success: false, error: 'لا يمكن إضافة وكيل بدون شركة مرتبطة' }

  const targetCompanyId = actor.companyId
  const { data: signUpData, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName || email,
        phone,
        role: 'agent',
        company_id: targetCompanyId,
      },
    },
  })

  if (error) return { success: false, error: error.message }

  if (signUpData.user) {
    const insertPayload = {
      id: signUpData.user.id,
      full_name: fullName || email,
      phone: phone || null,
      role: 'agent',
      account_type: 'individual',
      company_id: targetCompanyId,
      branch_id: actor.branchId,
      status: 'active',
      onboarding_completed: true,
    }

    const { error: profileError } = await supabase.from('user_profiles').insert(insertPayload)
    if (profileError) return { success: false, error: profileError.message }
  }

  revalidateTeam()
  return { success: true }
}

export async function getTeamMembers() {
  const supabase = await createServerSupabaseClient()
  const actor = await getActorProfile(supabase)
  if (!actor || !canManageTeam(actor.role)) return []

  const targetCompanyId = actor.companyId ?? actor.id
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('company_id', targetCompanyId)
    .in('role', ['branch_manager', 'senior_agent', 'agent', 'individual', 'viewer'])
    .order('full_name')

  if (error) throw new Error(error.message)
  return (data || []).map((member) => ({ ...member, email: null }))
}

export async function assignLeadToMember(leadId: string, memberId: string) {
  const supabase = await createServerSupabaseClient()
  const actor = await requireTeamManager(supabase)
  const member = await requireManagedMember(supabase, actor, memberId)

  if (!canManageRole(actor.role, member.role)) throw new Error('غير مصرح بتكليف هذا العضو')

  const { data: lead } = await supabase
    .from('leads')
    .select('client_name')
    .eq('id', leadId)
    .maybeSingle()

  const { error: updateError } = await supabase
    .from('leads')
    .update({ user_id: memberId })
    .eq('id', leadId)

  if (updateError) throw new Error(updateError.message)

  if (lead) {
    await supabase
      .from('notifications')
      .insert({
        user_id: memberId,
        type: 'new_client',
        title: 'تكليف إداري: عميل جديد',
        body: `تم تكليفك بمتابعة العميل ${lead.client_name ?? ''}.`,
        message: `تم تكليفك بمتابعة العميل ${lead.client_name ?? ''}.`,
        link: `/dashboard/leads/${leadId}`,
      })
  }

  revalidatePath('/dashboard/leads')
  return { success: true }
}

export async function updateMemberRole(memberId: string, role: string) {
  const supabase = await createServerSupabaseClient()
  const actor = await requireTeamManager(supabase)
  const member = await requireManagedMember(supabase, actor, memberId)
  const nextRole = normalizeRole(role)

  if (member.id === actor.id) throw new Error('لا يمكنك تغيير دور حسابك الحالي')
  if (!canManageRole(actor.role, member.role) || !canAssignRole(actor.role, nextRole)) {
    throw new Error('غير مصرح بتعديل هذا الدور')
  }

  const { error } = await supabase.from('user_profiles').update({ role: nextRole }).eq('id', memberId)
  if (error) throw new Error(error.message)
  await supabase.from('profiles').update({ role: nextRole }).eq('id', memberId)
  revalidateTeam()
}

export async function suspendMember(memberId: string) {
  const supabase = await createServerSupabaseClient()
  const actor = await requireTeamManager(supabase)
  const member = await requireManagedMember(supabase, actor, memberId)

  if (member.id === actor.id) throw new Error('لا يمكنك تعليق حسابك الحالي')
  if (!canManageRole(actor.role, member.role)) throw new Error('غير مصرح بتعليق هذا الحساب')

  const { error } = await supabase.from('user_profiles').update({ status: 'suspended' }).eq('id', memberId)
  if (error) throw new Error(error.message)
  await supabase.from('profiles').update({ status: 'suspended', is_active: false }).eq('id', memberId)
  revalidateTeam()
}

export async function inviteAgentByEmail(email: string, fullName: string) {
  const result = await addTeamMember({ email, fullName })
  revalidateTeam()
  return result
}

async function requireTeamManager(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const actor = await getActorProfile(supabase)
  if (!actor) throw new Error('يجب تسجيل الدخول أولًا')
  if (!canManageTeam(actor.role)) throw new Error('غير مصرح بإدارة الفريق')
  return actor
}

async function getActorProfile(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<ActorProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('id, role, company_id, branch_id, status')
    .eq('id', user.id)
    .maybeSingle()

  const { data: legacyProfile } = userProfile ? { data: null } : await supabase
    .from('profiles')
    .select('id, role, company_id, status')
    .eq('id', user.id)
    .maybeSingle()

  const profile = userProfile ?? legacyProfile
  if (!profile || profile.status === 'suspended' || profile.status === 'rejected') return null

  const branchId = 'branch_id' in profile && typeof profile.branch_id === 'string' ? profile.branch_id : null

  return {
    id: user.id,
    role: normalizeRole(profile.role ?? 'viewer'),
    companyId: profile.company_id ?? null,
    branchId,
  }
}

async function requireManagedMember(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actor: ActorProfile,
  memberId: string,
): Promise<MemberProfile> {
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('id, role, company_id')
    .eq('id', memberId)
    .maybeSingle()

  const { data: legacyProfile } = userProfile ? { data: null } : await supabase
    .from('profiles')
    .select('id, role, company_id')
    .eq('id', memberId)
    .maybeSingle()

  const profile = userProfile ?? legacyProfile
  if (!profile) throw new Error('عضو الفريق غير موجود')
  if (actor.role !== 'super_admin' && actor.companyId !== profile.company_id) throw new Error('لا يمكنك إدارة عضو خارج شركتك')

  return {
    id: profile.id,
    role: normalizeRole(profile.role ?? 'viewer'),
    companyId: profile.company_id ?? null,
  }
}

function revalidateTeam() {
  revalidatePath('/dashboard/team')
  revalidatePath('/company/dashboard')
}
