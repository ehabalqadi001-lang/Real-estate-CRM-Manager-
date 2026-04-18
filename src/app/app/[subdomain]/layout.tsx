import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, LayoutDashboard, Settings, Users } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'

type TenantBranding = {
  id: string
  subdomain: string
  company_name: string
  primary_color: string | null
  logo_url: string | null
  status: string
}

export const dynamic = 'force-dynamic'

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const tenant = await getTenantBranding(subdomain)
  if (!tenant) notFound()

  const primaryColor = normalizeColor(tenant.primary_color) ?? '#0f766e'
  const logoUrl = normalizeLogoUrl(tenant.logo_url)
  const logoStyle = logoUrl ? { backgroundImage: `url(${JSON.stringify(logoUrl)})` } : undefined
  const style = {
    '--tenant-primary': primaryColor,
    '--primary': primaryColor,
    '--fi-emerald': primaryColor,
    '--fi-gradient-primary': `linear-gradient(135deg, ${primaryColor}, #0f172a)`,
  } as CSSProperties

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950" style={style} data-tenant-id={tenant.id}>
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
          <Link href="/" className="flex items-center gap-3 rounded-lg p-2">
            <span
              className="flex size-11 items-center justify-center rounded-lg bg-[var(--tenant-primary)] bg-contain bg-center bg-no-repeat text-white"
              style={logoStyle}
            >
              {!logoUrl && <Building2 className="size-5" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">{tenant.company_name}</span>
              <span className="block truncate text-xs font-bold text-slate-500">{tenant.subdomain}.fastinvestment.com</span>
            </span>
          </Link>

          <nav className="mt-6 space-y-1">
            <TenantNavItem href="/" icon={LayoutDashboard} label="Workspace" />
            <TenantNavItem href="/dashboard/team" icon={Users} label="Team" />
            <TenantNavItem href="/dashboard/settings" icon={Settings} label="Settings" />
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex size-10 items-center justify-center rounded-lg bg-[var(--tenant-primary)] bg-contain bg-center bg-no-repeat text-white lg:hidden"
                  style={logoStyle}
                >
                  {!logoUrl && <Building2 className="size-5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{tenant.company_name}</p>
                  <p className="truncate text-xs font-bold text-slate-500">White-label CRM</p>
                </div>
              </div>
              <div className="rounded-lg bg-[var(--tenant-primary)] px-3 py-2 text-xs font-black text-white">
                {tenant.status}
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  )
}

async function getTenantBranding(subdomain: string): Promise<TenantBranding | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .rpc('get_tenant_branding', { p_subdomain: subdomain })
    .maybeSingle()

  if (error || !data) return null
  return data as TenantBranding
}

function TenantNavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: typeof LayoutDashboard
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[var(--tenant-primary)]"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  )
}

function normalizeColor(color: string | null | undefined) {
  if (!color) return null
  return /^#[0-9a-f]{6}$/i.test(color) ? color : null
}

function normalizeLogoUrl(url: string | null | undefined) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null
  } catch {
    return null
  }
}
