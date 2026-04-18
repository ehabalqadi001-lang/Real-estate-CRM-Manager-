'use server'

import { revalidatePath } from 'next/cache'
import { createRawClient, createServerClient } from '@/lib/supabase/server'

export async function saveCompanySettings(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, tenant_id, role')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id ?? profile?.company_id ?? user.id
  const brandColor = String(formData.get('primary_brand_color') ?? '').trim()
  const tenantPayload: Record<string, unknown> = {
    company_name: formData.get('company_name') || null,
    domain: formData.get('domain') || null,
    logo_url: formData.get('logo_url') || null,
  }

  if (/^#[0-9a-f]{6}$/i.test(brandColor)) {
    tenantPayload.primary_brand_color = brandColor
  }

  const { error } = await supabase
    .from('tenants')
    .update(tenantPayload)
    .eq('id', tenantId)

  if (error) throw new Error(error.message)

  await supabase
    .from('profiles')
    .update({
      company_name: formData.get('company_name') || null,
      phone: formData.get('phone') || null,
      logo_url: formData.get('logo_url') || null,
      primary_brand_color: tenantPayload.primary_brand_color,
    })
    .eq('id', tenantId)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
}

export async function getCompanySettings() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, tenant_id, role, notification_prefs')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id ?? profile?.company_id ?? user.id

  const [{ data: tenant }, { data: owner }] = await Promise.all([
    supabase
      .from('tenants')
      .select('company_name, domain, logo_url, primary_brand_color, plan_tier, status')
      .eq('id', tenantId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('company_name, phone, full_name, notification_prefs')
      .eq('id', tenantId)
      .maybeSingle(),
  ])

  return {
    ...(owner ?? {}),
    ...(tenant ?? {}),
    notification_prefs: profile?.notification_prefs ?? owner?.notification_prefs ?? null,
  }
}

export async function saveNotificationPrefs(prefs: Record<string, boolean>) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .update({ notification_prefs: prefs })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/settings')
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { ok: false, error: 'Unauthorized' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) return { ok: false, error: 'Current password is incorrect' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
