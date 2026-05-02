import { BarChart3, Building2, Home, ShieldCheck } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { createTenantScopedClient } from '@/lib/supabase/tenant-server'

export const dynamic = 'force-dynamic'

export default async function TenantWorkspacePage({
  params,
}: {
  params: Promise<{ subdomain: string; path?: string[] }>
}) {
  const { subdomain, path = [] } = await params
  const tenant = await resolveTenant(subdomain)
  const scoped = tenant ? await createTenantScopedClient(tenant.id) : null

  const [{ count: leadsCount }, { count: dealsCount }, { count: listingsCount }] = scoped
    ? await Promise.all([
      scoped.fromTenant('leads').select('id', { count: 'exact', head: true }),
      scoped.fromTenant('deals').select('id', { count: 'exact', head: true }),
      scoped.fromTenant('units').select('id', { count: 'exact', head: true }),
    ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--tenant-primary)]">
              Tenant route /{path.join('/') || 'home'}
            </p>
            <h1 className="mt-2 text-2xl font-black">Subdomain workspace</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Requests for this tenant subdomain are rewritten into this isolated workspace and resolved against the tenant record before rendering.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
            <ShieldCheck className="size-4" />
            RLS tenant scope active
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={Home} label="Tenant leads" value={leadsCount ?? 0} />
        <Metric icon={BarChart3} label="Tenant deals" value={dealsCount ?? 0} />
        <Metric icon={Building2} label="Tenant listings" value={listingsCount ?? 0} />
      </section>
    </div>
  )
}

async function resolveTenant(subdomain: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .rpc('get_tenant_branding', { p_subdomain: subdomain })
    .maybeSingle()

  return data as { id: string } | null
}

function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 text-xl sm:text-3xl font-black">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--tenant-primary)] text-white">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}
