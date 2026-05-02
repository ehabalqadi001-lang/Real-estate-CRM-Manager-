'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import type { AppProfile } from '@/shared/auth/types'
import type { CompanyOption } from '@/shared/company-context/server'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import { CompanyContextSwitcher } from './CompanyContextSwitcher'

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

export function UserProfileDropdown({
  profile,
  companyOptions,
}: {
  profile: AppProfile
  companyOptions?: CompanyOption[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = (profile.full_name ?? profile.email ?? 'U').substring(0, 2).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-[var(--fi-line)] bg-white p-1 pr-3 transition hover:border-emerald-300 dark:bg-white/5"
        aria-label="User Profile"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          {initials}
        </div>
        <span className="hidden text-sm font-bold text-[var(--fi-ink)] sm:block">
          {profile.full_name ?? 'User'}
        </span>
        <ChevronDown className="size-4 text-[var(--fi-muted)]" />
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-72 rounded-xl border border-[var(--fi-line)] bg-white p-2 shadow-xl dark:bg-slate-900 z-50 max-w-[calc(100vw-1rem)]">
          <div className="mb-2 px-2 pb-2 border-b border-[var(--fi-line)]">
             <p className="text-sm font-bold text-[var(--fi-ink)] truncate">{profile.full_name}</p>
             <p className="text-xs text-[var(--fi-muted)] truncate">{labelRole(profile.role)}</p>
          </div>
          
          <div className="mb-2 space-y-3 px-2">
            {companyOptions && companyOptions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[var(--fi-muted)] mb-1">Company</p>
                <div className="relative w-full">
                  <CompanyContextSwitcher activeCompanyId={profile.active_company_id ?? profile.company_id} companies={companyOptions} />
                </div>
              </div>
            )}
            <div>
               <p className="text-xs font-bold text-[var(--fi-muted)] mb-1">Theme</p>
               <ThemeToggle />
            </div>
            <div>
               <p className="text-xs font-bold text-[var(--fi-muted)] mb-1">Language</p>
               <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 justify-center overflow-hidden">
                 <LanguageToggle />
               </div>
            </div>
          </div>
          
          <form action="/auth/logout" method="post" className="border-t border-[var(--fi-line)] pt-2 mt-2">
            <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <LogOut className="size-4" />
              <span>تسجيل الخروج</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
