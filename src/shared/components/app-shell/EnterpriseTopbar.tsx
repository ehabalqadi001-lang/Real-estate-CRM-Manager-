'use client'

import { Menu, Search, ShieldCheck, Sparkles } from 'lucide-react'
import type { AppProfile } from '@/shared/auth/types'
import type { CompanyOption } from '@/shared/company-context/server'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import ThemeToggle from '@/components/ThemeToggle'
import { CompanyContextSwitcher } from './CompanyContextSwitcher'

export function EnterpriseTopbar({ profile, companyOptions = [] }: { profile: AppProfile; companyOptions?: CompanyOption[] }) {
  const tenantName = profile.active_company_name ?? profile.tenant_name ?? 'FAST INVESTMENT'

  function openCommandPalette() {
    window.dispatchEvent(new Event('fi:open-command-palette'))
  }

  function openSidebar() {
    window.dispatchEvent(new Event('fi:open-sidebar'))
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--fi-line)] bg-white/82 px-3 py-3 backdrop-blur-xl dark:bg-slate-950/82 sm:px-4">
      <div className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <button
            type="button"
            onClick={openSidebar}
            aria-label="Open primary navigation"
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)] transition hover:bg-[var(--fi-soft)]/80 lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">{tenantName}</p>
            <h1 className="mt-1 truncate text-sm font-black text-[var(--fi-ink)] sm:text-lg">Real Estate Command Center</h1>
          </div>
        </div>

        <div className="hidden min-w-0 justify-center px-2 md:flex xl:px-8">
          <button
            type="button"
            onClick={openCommandPalette}
            className="fi-focus flex h-11 w-full max-w-xl items-center justify-between rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-muted)] shadow-sm transition hover:border-[var(--fi-emerald)] hover:text-[var(--fi-ink)] dark:bg-white/5"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Search className="size-4 shrink-0 text-[var(--fi-emerald)]" aria-hidden="true" />
              <span className="truncate">Search clients, deals, units, or commands</span>
            </span>
            <span className="rounded-md border border-[var(--fi-line)] bg-[var(--fi-soft)] px-2 py-1 text-[10px] text-[var(--fi-muted)]">Ctrl K</span>
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <ThemeToggle />
          <NotificationBell userId={profile.id} />
          <CompanyContextSwitcher activeCompanyId={profile.active_company_id ?? profile.company_id} companies={companyOptions} />
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex size-10 items-center justify-center rounded-lg border border-[var(--fi-line)] bg-white text-[var(--fi-emerald)] dark:bg-white/5 md:hidden"
            aria-label="Open search"
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
          <div className="hidden items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2 text-xs font-black text-[var(--fi-ink)] dark:bg-white/5 sm:flex">
            <ShieldCheck className="size-4 text-[var(--fi-emerald)]" aria-hidden="true" />
            {labelRole(profile.role)}
          </div>
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex size-10 items-center justify-center rounded-lg text-white shadow-sm transition hover:scale-[1.03]"
            style={{ background: 'var(--fi-gradient-primary)' }}
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
    company_admin: 'Company Administrator',
    branch_manager: 'Branch Manager',
    senior_agent: 'Senior Agent',
    hr_manager: 'HR Manager',
    hr_staff: 'HR Specialist',
    hr_officer: 'HR Officer',
    admin: 'Administrator',
    company: 'Company',
    broker: 'Broker',
    agent: 'Agent',
    customer_support: 'Customer Support',
    finance_officer: 'Finance Officer',
    finance_manager: 'Finance Manager',
    CLIENT: 'Client',
    client: 'Client',
  }

  return labels[role] ?? role
}
