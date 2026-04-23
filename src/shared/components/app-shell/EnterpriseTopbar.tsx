'use client'

import { useEffect, useState } from 'react'
import { Menu, Search, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import type { AppProfile } from '@/shared/auth/types'
import type { CompanyOption } from '@/shared/company-context/server'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import ThemeToggle from '@/components/ThemeToggle'
import { CompanyContextSwitcher } from './CompanyContextSwitcher'

function useGreeting(firstName: string) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    const salutation =
      hour < 12 ? 'Good morning' :
      hour < 17 ? 'Good afternoon' :
                  'Good evening'
    setGreeting(`${salutation}, ${firstName}`)
  }, [firstName])

  return greeting
}

export function EnterpriseTopbar({
  profile,
  companyOptions = [],
}: {
  profile: AppProfile
  companyOptions?: CompanyOption[]
}) {
  const tenantName = profile.active_company_name ?? profile.tenant_name ?? 'FAST INVESTMENT'
  const firstName = (profile.full_name ?? profile.email ?? 'there').split(' ')[0]
  const greeting = useGreeting(firstName)

  function openCommandPalette() {
    window.dispatchEvent(new Event('fi:open-command-palette'))
  }

  function openSidebar() {
    window.dispatchEvent(new Event('fi:open-sidebar'))
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--fi-line)] bg-white/90 px-3 py-2.5 backdrop-blur-xl dark:bg-slate-950/90 sm:px-4">
      <div className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3">

        {/* Left: brand + mobile toggle */}
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <button
            type="button"
            onClick={openSidebar}
            aria-label="Open primary navigation"
            className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-[var(--fi-soft)] text-[var(--fi-emerald)] transition hover:scale-[1.04] hover:bg-emerald-50 lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">
                {tenantName}
              </span>
              <span className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-600 sm:flex">
                <TrendingUp className="size-2.5" />
                Live
              </span>
            </div>
            {greeting ? (
              <p className="mt-0.5 truncate text-sm font-black text-[var(--fi-ink)] sm:text-base">
                {greeting}
              </p>
            ) : (
              <h1 className="mt-0.5 truncate text-sm font-black text-[var(--fi-ink)] sm:text-base">
                Real Estate Command Center
              </h1>
            )}
          </div>
        </div>

        {/* Center: search bar */}
        <div className="hidden min-w-0 justify-center px-2 md:flex xl:px-8">
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex h-11 w-full max-w-xl items-center justify-between rounded-xl border border-[var(--fi-line)] bg-white px-3.5 text-sm font-bold text-[var(--fi-muted)] shadow-sm transition-all duration-150 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/10 dark:bg-white/5"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Search className="size-4 shrink-0 text-[var(--fi-emerald)]" aria-hidden="true" />
              <span className="truncate">Search clients, deals, units or commands…</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-2 py-1 text-[10px] font-black text-[var(--fi-muted)]">
              ⌘K
            </span>
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <ThemeToggle />
          <NotificationBell userId={profile.id} />
          <CompanyContextSwitcher
            activeCompanyId={profile.active_company_id ?? profile.company_id}
            companies={companyOptions}
          />

          {/* Mobile search */}
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex size-10 items-center justify-center rounded-xl border border-[var(--fi-line)] bg-white text-[var(--fi-emerald)] transition hover:border-emerald-300 dark:bg-white/5 md:hidden"
            aria-label="Open search"
          >
            <Search className="size-4" aria-hidden="true" />
          </button>

          {/* Role badge */}
          <div className="hidden items-center gap-1.5 rounded-xl border border-[var(--fi-line)] bg-white px-3 py-2 text-xs font-black text-[var(--fi-ink)] dark:bg-white/5 sm:flex">
            <ShieldCheck className="size-3.5 text-[var(--fi-emerald)]" aria-hidden="true" />
            {labelRole(profile.role)}
          </div>

          {/* Command palette trigger */}
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex size-10 items-center justify-center rounded-xl text-white shadow-md shadow-emerald-500/20 transition hover:scale-[1.05]"
            style={{ background: 'linear-gradient(135deg, #00c27c, #0081cc)' }}
            aria-label="Open command palette"
          >
            <Sparkles className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}

function labelRole(role: string) {
  const labels: Record<string, string> = {
    super_admin: 'System Administrator',
    platform_admin: 'Platform Administrator',
    company_owner: 'Company Owner',
    company_admin: 'Company Admin',
    branch_manager: 'Branch Manager',
    senior_agent: 'Senior Agent',
    hr_manager: 'HR Manager',
    hr_staff: 'HR Specialist',
    hr_officer: 'HR Officer',
    admin: 'Administrator',
    company: 'Company',
    broker: 'Broker',
    agent: 'Sales Agent',
    customer_support: 'Customer Support',
    finance_officer: 'Finance Officer',
    finance_manager: 'Finance Manager',
    CLIENT: 'Client',
    client: 'Client',
  }
  return labels[role] ?? role
}
