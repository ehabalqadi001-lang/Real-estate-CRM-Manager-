'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/shared/rbac/require-permission'

type TenantMetric = {
  tenant_id: string
  company_name: string
  domain: string | null
  logo_url: string | null
  primary_brand_color: string | null
  primary_color?: string | null
  subdomain?: string | null
  plan_tier: string
  tenant_status: string
  subscription_status: string | null
  billing_cycle: string | null
  amount: number | null
  currency: string | null
  current_period_end: string | null
  user_count: number | null
  lead_count: number | null
  deal_count: number | null
  listing_count: number | null
  created_at: string
}

export async function getTenantDashboardData() {
  await requirePermission('platform.manage')
  const supabase = await createServerClient()

  const [{ data: tenants }, { data: plans }] = await Promise.all([
    supabase
      .from('v_saas_tenant_metrics')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('plan_tiers')
      .select('slug, name, monthly_price, annual_price, max_users, max_listings')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  const rows = (tenants ?? []) as TenantMetric[]
  const totalActiveTenants = rows.filter((row) => row.tenant_status === 'active').length
  const mrr = rows
    .filter((row) => row.subscription_status === 'active' || row.subscription_status === 'trial')
    .reduce((sum, row) => {
      const amount = Number(row.amount ?? 0)
      return sum + (row.billing_cycle === 'annual' ? amount / 12 : amount)
    }, 0)

  return {
    tenants: rows,
    plans: plans ?? [],
    stats: {
      totalTenants: rows.length,
      totalActiveTenants,
      mrr,
      suspendedTenants: rows.filter((row) => row.tenant_status === 'suspended').length,
    },
  }
}

export async function createTenant(formData: FormData) {
  await requirePermission('platform.manage')
  const supabase = await createServerClient()

  const companyName = String(formData.get('company_name') ?? '').trim()
  if (!companyName) throw new Error('Company name is required')

  const planTier = String(formData.get('plan_tier') ?? 'basic')
  const billingCycle = String(formData.get('billing_cycle') ?? 'monthly')
  const adminEmail = String(formData.get('admin_email') ?? '').trim().toLowerCase()
  const amount = Number(formData.get('amount') ?? 0)

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      company_name: companyName,
      domain: nullableText(formData.get('domain')),
      subdomain: nullableText(formData.get('subdomain')),
      logo_url: nullableText(formData.get('logo_url')),
      primary_brand_color: normalizeColor(String(formData.get('primary_brand_color') ?? '')) ?? '#0f766e',
      primary_color: normalizeColor(String(formData.get('primary_brand_color') ?? '')) ?? '#0f766e',
      plan_tier: planTier,
      status: String(formData.get('status') ?? 'trial'),
      max_users: Number(formData.get('max_users') ?? 5),
      max_listings: Number(formData.get('max_listings') ?? 50),
      metadata: adminEmail ? { initial_admin_email: adminEmail } : {},
    })
    .select('id')
    .single()

  if (tenantError) throw new Error(tenantError.message)

  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .insert({
      tenant_id: tenant.id,
      plan_tier: planTier,
      status: String(formData.get('subscription_status') ?? 'trial'),
      billing_cycle: billingCycle,
      amount,
      currency: String(formData.get('currency') ?? 'EGP'),
    })

  if (subscriptionError) throw new Error(subscriptionError.message)

  if (adminEmail) {
    await supabase
      .from('profiles')
      .update({
        tenant_id: tenant.id,
        company_id: tenant.id,
        company_name: companyName,
        role: 'company_admin',
        account_type: 'company',
        status: 'approved',
        is_active: true,
      })
      .eq('email', adminEmail)
  }

  revalidatePath('/admin/super-dashboard')
}

export async function updateTenantPlan(formData: FormData) {
  await requirePermission('platform.manage')
  const supabase = await createServerClient()

  const tenantId = String(formData.get('tenant_id') ?? '')
  const planTier = String(formData.get('plan_tier') ?? 'basic')
  const status = String(formData.get('status') ?? 'active')
  const amount = Number(formData.get('amount') ?? 0)

  const { error: tenantError } = await supabase
    .from('tenants')
    .update({
      plan_tier: planTier,
      status,
      max_users: Number(formData.get('max_users') ?? 5),
      max_listings: Number(formData.get('max_listings') ?? 50),
    })
    .eq('id', tenantId)

  if (tenantError) throw new Error(tenantError.message)

  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      tenant_id: tenantId,
      plan_tier: planTier,
      status: String(formData.get('subscription_status') ?? status),
      billing_cycle: String(formData.get('billing_cycle') ?? 'monthly'),
      amount,
      currency: String(formData.get('currency') ?? 'EGP'),
    }, { onConflict: 'tenant_id' })

  if (subError) throw new Error(subError.message)
  revalidatePath('/admin/super-dashboard')
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text.length ? text : null
}

function normalizeColor(color: string) {
  const trimmed = color.trim()
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : null
}
