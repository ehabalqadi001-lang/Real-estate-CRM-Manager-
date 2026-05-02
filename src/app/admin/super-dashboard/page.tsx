import type { InputHTMLAttributes } from 'react'
import { Building2, CircleDollarSign, ShieldAlert, SlidersHorizontal, Users, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTenant, getTenantDashboardData, updateTenantPlan } from './actions'

export const dynamic = 'force-dynamic'

const currencyFormatter = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
})

export default async function SuperDashboard() {
  const { tenants, plans, stats } = await getTenantDashboardData()

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="ltr">
      <section className="rounded-lg border border-[var(--fi-line)] bg-[#0B1120] p-5 text-white shadow-xl sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-white/10 text-[var(--fi-emerald)]">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fi-emerald)]">FAST INVESTMENT SaaS OS</p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">Super Admin Tenant Management</h1>
            </div>
          </div>
          <Badge className="bg-white/10 text-white hover:bg-white/10">Strict tenant isolation enabled</Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Building2} label="Total tenants" value={String(stats.totalTenants)} />
        <MetricCard icon={Users} label="Active companies" value={String(stats.totalActiveTenants)} />
        <MetricCard icon={CircleDollarSign} label="MRR" value={currencyFormatter.format(stats.mrr)} />
        <MetricCard icon={ShieldAlert} label="Suspended" value={String(stats.suspendedTenants)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Onboard Brokerage</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTenant} className="space-y-4">
              <Field label="Company name" name="company_name" required placeholder="Prime Brokerage" />
              <Field label="Subdomain" name="subdomain" required placeholder="prime" />
              <Field label="Domain" name="domain" placeholder="prime.example.com" />
              <Field label="Initial admin email" name="admin_email" type="email" placeholder="admin@prime.example.com" />
              <Field label="Logo URL" name="logo_url" placeholder="https://..." />
              <Field label="Brand color" name="primary_brand_color" type="color" defaultValue="#0f766e" />
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <Field label="Max users" name="max_users" type="number" defaultValue="10" min="1" />
                <Field label="Max listings" name="max_listings" type="number" defaultValue="100" min="1" />
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <SelectField label="Plan" name="plan_tier" options={plans.map((plan) => ({ label: String(plan.name), value: String(plan.slug) }))} />
                <SelectField label="Tenant status" name="status" options={statusOptions} defaultValue="trial" />
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <SelectField label="Subscription" name="subscription_status" options={subscriptionOptions} defaultValue="trial" />
                <SelectField label="Cycle" name="billing_cycle" options={cycleOptions} defaultValue="monthly" />
              </div>
              <Field label="Monthly amount" name="amount" type="number" defaultValue="0" min="0" />
              <input type="hidden" name="currency" value="EGP" />
              <Button type="submit" className="w-full">
                <Building2 className="size-4" />
                Create tenant
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {tenants.length ? tenants.map((tenant) => (
            <Card key={tenant.tenant_id}>
              <CardContent className="pt-0">
                <div className="grid gap-4 py-2 lg:grid-cols-[1fr_360px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-black text-[var(--fi-ink)]">{tenant.company_name}</h2>
                      <Badge variant={tenant.tenant_status === 'active' ? 'default' : tenant.tenant_status === 'suspended' ? 'destructive' : 'secondary'}>
                        {tenant.tenant_status}
                      </Badge>
                      <Badge variant="outline">{tenant.plan_tier}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--fi-muted)]">
                      {tenant.subdomain ? `${tenant.subdomain}.fastinvestment.com` : tenant.domain ?? 'No tenant subdomain'}
                    </p>
                    <div className="mt-4 grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <MiniStat label="Users" value={tenant.user_count ?? 0} />
                      <MiniStat label="Leads" value={tenant.lead_count ?? 0} />
                      <MiniStat label="Deals" value={tenant.deal_count ?? 0} />
                      <MiniStat label="Listings" value={tenant.listing_count ?? 0} />
                    </div>
                  </div>

                  <form action={updateTenantPlan} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3">
                    <input type="hidden" name="tenant_id" value={tenant.tenant_id} />
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      <SelectField label="Plan" name="plan_tier" defaultValue={tenant.plan_tier} options={plans.map((plan) => ({ label: String(plan.name), value: String(plan.slug) }))} compact />
                      <SelectField label="Tenant" name="status" defaultValue={tenant.tenant_status} options={statusOptions} compact />
                      <SelectField label="Billing" name="subscription_status" defaultValue={tenant.subscription_status ?? 'trial'} options={subscriptionOptions} compact />
                      <SelectField label="Cycle" name="billing_cycle" defaultValue={tenant.billing_cycle ?? 'monthly'} options={cycleOptions} compact />
                      <Field label="MRR" name="amount" type="number" defaultValue={String(tenant.amount ?? 0)} min="0" compact />
                      <Field label="Users" name="max_users" type="number" defaultValue="10" min="1" compact />
                      <Field label="Listings" name="max_listings" type="number" defaultValue="100" min="1" compact />
                      <input type="hidden" name="currency" value={tenant.currency ?? 'EGP'} />
                      <Button type="submit" className="self-end">
                        <SlidersHorizontal className="size-4" />
                        Update
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-[var(--fi-muted)]">
                No tenants found. Create the first brokerage from the onboarding form.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--fi-muted)]">{label}</p>
            <p className="mt-2 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">{value}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)]">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[var(--fi-soft)] px-3 py-2">
      <p className="text-[11px] font-bold text-[var(--fi-muted)]">{label}</p>
      <p className="mt-1 font-black text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}

function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; compact?: boolean }) {
  const { label, compact, className, ...inputProps } = props
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name} className={compact ? 'text-xs' : undefined}>{label}</Label>
      <Input id={props.name} className={className} {...inputProps} />
    </div>
  )
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
  compact,
}: {
  label: string
  name: string
  options: { label: string; value: string }[]
  defaultValue?: string
  compact?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className={compact ? 'text-xs' : undefined}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? options[0]?.value}
        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

const statusOptions = [
  { label: 'Trial', value: 'trial' },
  { label: 'Active', value: 'active' },
  { label: 'Past due', value: 'past_due' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Canceled', value: 'canceled' },
]

const subscriptionOptions = [
  { label: 'Trial', value: 'trial' },
  { label: 'Active', value: 'active' },
  { label: 'Past due', value: 'past_due' },
  { label: 'Canceled', value: 'canceled' },
]

const cycleOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annual', value: 'annual' },
]
