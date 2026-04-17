'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, getCompanyId } from '@/lib/supabase/server'
import { notifyAdmins, notifyLeadAssigned, notifyLeadStatusChanged } from '@/lib/notify'
import { recalculateLeadScore } from '@/app/dashboard/leads/scoring'
import type { Lead, BuyerRequirement, LeadActivity } from '@/lib/types/db'

// ─── LEADS ───────────────────────────────────────────────────────

export async function getLeads(opts?: {
  status?: string
  query?: string
  temperature?: string
  assignedTo?: string
  page?: number
  pageSize?: number
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { leads: [], total: 0 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const companyId = await getCompanyId()
  const pageSize = opts?.pageSize ?? 50
  const page = opts?.page ?? 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const ADMIN_ROLES = ['admin', 'Admin', 'company_admin', 'company', 'super_admin', 'Super_Admin']
  const isAdmin = ADMIN_ROLES.includes(profile?.role ?? '')

  let q = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (isAdmin && companyId) {
    q = q.or(`company_id.eq.${companyId},user_id.eq.${user.id}`)
  } else {
    q = q.or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
  }

  if (opts?.status)      q = q.eq('status', opts.status)
  if (opts?.temperature) q = q.eq('temperature', opts.temperature)
  if (opts?.assignedTo)  q = q.eq('assigned_to', opts.assignedTo)
  if (opts?.query) {
    q = q.or(
      `client_name.ilike.%${opts.query}%,full_name.ilike.%${opts.query}%,phone.ilike.%${opts.query}%,email.ilike.%${opts.query}%`
    )
  }

  const { data, count } = await q
  return { leads: (data ?? []) as Lead[], total: count ?? 0 }
}

export async function getLead(id: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as Lead
}

export async function createLead(input: {
  name: string
  phone?: string
  email?: string
  propertyType?: string
  expectedValue?: number
  source?: string
  temperature?: string
  notes?: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const companyId = await getCompanyId()

  const { data: inserted, error } = await supabase.from('leads').insert({
    client_name:    input.name,
    full_name:      input.name,
    phone:          input.phone ?? null,
    email:          input.email ?? null,
    property_type:  input.propertyType ?? 'غير محدد',
    expected_value: input.expectedValue ?? 0,
    source:         input.source ?? null,
    temperature:    input.temperature ?? 'warm',
    notes:          input.notes ?? null,
    status:         'Fresh Leads',
    user_id:        user.id,
    company_id:     companyId,
    score:          0,
  }).select('id').single()

  if (error) return { success: false, error: error.message }

  void notifyAdmins(
    'عميل محتمل جديد',
    `${input.name} — أضافه ${user.email}`,
    inserted?.id ? `/dashboard/crm/leads/${inserted.id}` : '/dashboard/crm/leads'
  )

  revalidatePath('/dashboard/crm/leads')
  revalidatePath('/dashboard/leads')
  return { success: true, id: inserted?.id }
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
  const supabase = await createServerClient()
  const { data: lead } = await supabase
    .from('leads')
    .select('client_name, full_name, user_id, assigned_to')
    .eq('id', leadId)
    .single()

  const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId)
  if (error) throw new Error(error.message)

  const leadName = lead?.full_name || lead?.client_name || 'عميل'
  const agentId  = lead?.assigned_to || lead?.user_id
  if (agentId) void notifyLeadStatusChanged(agentId, leadName, newStatus, leadId)

  revalidatePath('/dashboard/crm/leads')
  revalidatePath('/dashboard/leads')
  revalidatePath(`/dashboard/crm/leads/${leadId}`)
  return { success: true }
}

export async function assignLead(leadId: string, agentId: string) {
  const supabase = await createServerClient()
  const { data: lead } = await supabase
    .from('leads')
    .select('client_name, full_name')
    .eq('id', leadId)
    .single()

  const { error } = await supabase.from('leads').update({ assigned_to: agentId }).eq('id', leadId)
  if (error) throw new Error(error.message)

  void notifyLeadAssigned(agentId, lead?.full_name || lead?.client_name || 'عميل', leadId)
  revalidatePath('/dashboard/crm/leads')
  return { success: true }
}

// ─── ACTIVITIES ──────────────────────────────────────────────────

export async function addActivity(input: {
  leadId: string
  type: LeadActivity['type']
  outcome?: string
  note?: string
  durationMin?: number
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('lead_activities').insert({
    lead_id:      input.leadId,
    user_id:      user.id,
    type:         input.type,
    outcome:      input.outcome ?? null,
    note:         input.note ?? null,
    duration_min: input.durationMin ?? null,
  })
  if (error) throw new Error(error.message)

  void recalculateLeadScore(input.leadId)
  revalidatePath(`/dashboard/crm/leads/${input.leadId}`)
  revalidatePath(`/dashboard/leads/${input.leadId}`)
  return { success: true }
}

export async function getActivities(leadId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('lead_activities')
    .select('*, profiles(full_name)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  return (data ?? []) as (LeadActivity & { profiles: { full_name: string } | null })[]
}

// ─── BUYER REQUIREMENTS ──────────────────────────────────────────

export async function saveBuyerRequirements(leadId: string, req: Partial<BuyerRequirement>) {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()

  const { data: existing } = await supabase
    .from('buyer_requirements')
    .select('id')
    .eq('lead_id', leadId)
    .single()

  const payload = { ...req, lead_id: leadId, company_id: companyId, updated_at: new Date().toISOString() }

  if (existing) {
    await supabase.from('buyer_requirements').update(payload).eq('id', existing.id)
  } else {
    await supabase.from('buyer_requirements').insert(payload)
  }

  revalidatePath(`/dashboard/crm/leads/${leadId}`)
  return { success: true }
}

export async function getBuyerRequirements(leadId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('buyer_requirements')
    .select('*')
    .eq('lead_id', leadId)
    .single()
  return data as BuyerRequirement | null
}

// ─── BUYERS LIST (leads with requirements) ───────────────────────

export async function getBuyers(opts?: { query?: string; page?: number }) {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()
  if (!companyId) return { buyers: [], total: 0 }

  const pageSize = 40
  const page = opts?.page ?? 1
  const from = (page - 1) * pageSize

  let q = supabase
    .from('leads')
    .select('*, buyer_requirements(*)', { count: 'exact' })
    .or(`company_id.eq.${companyId},user_id.eq.${companyId}`)
    .in('status', ['Interested', 'Site Visit', 'Negotiation', 'Contracted', 'Follow Up'])
    .order('score', { ascending: false })
    .range(from, from + pageSize - 1)

  if (opts?.query) {
    q = q.or(`client_name.ilike.%${opts.query}%,full_name.ilike.%${opts.query}%,phone.ilike.%${opts.query}%`)
  }

  const { data, count } = await q
  return { buyers: data ?? [], total: count ?? 0 }
}

// ─── STATS ───────────────────────────────────────────────────────

export async function getCRMStats() {
  const supabase = await createServerClient()
  const companyId = await getCompanyId()
  if (!companyId) return null

  const { data } = await supabase
    .from('leads')
    .select('status, temperature, score, expected_value, created_at')
    .or(`company_id.eq.${companyId}`)

  const leads = data ?? []
  const now = new Date()
  const thisMonth = leads.filter(l => new Date(l.created_at).getMonth() === now.getMonth())

  return {
    total:          leads.length,
    thisMonth:      thisMonth.length,
    hot:            leads.filter(l => l.temperature === 'hot').length,
    interested:     leads.filter(l => ['Interested', 'Site Visit', 'Negotiation'].includes(l.status ?? '')).length,
    contracted:     leads.filter(l => l.status === 'Contracted').length,
    avgScore:       leads.length ? Math.round(leads.reduce((s, l) => s + (l.score ?? 0), 0) / leads.length) : 0,
    pipelineValue:  leads.reduce((s, l) => s + Number(l.expected_value ?? 0), 0),
  }
}
