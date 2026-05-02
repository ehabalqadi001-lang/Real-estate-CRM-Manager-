'use client'

import { useEffect, useState } from 'react'
import { Menu, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AppProfile } from '@/shared/auth/types'
import type { CompanyOption } from '@/shared/company-context/server'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { UserProfileDropdown } from './UserProfileDropdown'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

export function EnterpriseTopbar({
  profile,
  companyOptions = [],
}: {
  profile: AppProfile
  companyOptions?: CompanyOption[]
}) {
  const tenantName = profile.active_company_name ?? profile.tenant_name ?? 'FAST INVESTMENT'

  function openCommandPalette() {
    window.dispatchEvent(new Event('fi:open-command-palette'))
  }

  function openSidebar() {
    window.dispatchEvent(new Event('fi:open-sidebar'))
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        openCommandPalette()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b border-[var(--fi-line)] bg-white/90 px-3 py-2.5 backdrop-blur-xl dark:bg-slate-950/90 sm:px-4"
    >
      <div className="flex items-center justify-between gap-4 w-full">

        {/* Left: Mobile Menu & Brand Name (Visible mainly on mobile) */}
        <div className="flex items-center gap-2 lg:hidden w-auto shrink-0">
          <button
            type="button"
            onClick={openSidebar}
            aria-label="Open primary navigation"
            className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-[var(--fi-soft)] text-[var(--fi-emerald)] transition hover:bg-emerald-50 dark:bg-white/5"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-[var(--fi-emerald)] truncate max-w-[100px] hidden sm:block">
            {tenantName}
          </span>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-auto flex items-center">
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3.5 text-sm font-bold text-[var(--fi-muted)] shadow-sm transition-all duration-150 hover:border-emerald-300 dark:bg-white/5 dark:hover:border-emerald-700"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Search className="size-4 shrink-0 text-[var(--fi-emerald)]" aria-hidden="true" />
              <span className="truncate">بحث عن عملاء، صفقات، وحدات...</span>
            </span>
            <span className="hidden xs:flex shrink-0 items-center gap-1 rounded-lg border border-[var(--fi-line)] bg-white px-2 py-1 text-[10px] font-black text-[var(--fi-muted)] dark:bg-slate-800">
              ⌘K
            </span>
          </button>
        </div>

        {/* Right: Locale Switcher, Notifications & Profile */}
        <div className="flex shrink-0 items-center gap-2 justify-end w-auto">
          <LocaleSwitcher />
          <NotificationBell userId={profile.id} />
          <UserProfileDropdown profile={profile} companyOptions={companyOptions} />
        </div>
      </div>
    </motion.header>
  )
}
