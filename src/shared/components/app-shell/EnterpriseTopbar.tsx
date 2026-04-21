'use client'

import { Menu, Search, ShieldCheck, Sparkles } from 'lucide-react'
import type { AppProfile } from '@/shared/auth/types'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import ThemeToggle from '@/components/ThemeToggle'

export function EnterpriseTopbar({ profile }: { profile: AppProfile }) {
  const tenantName = profile.tenant_name ?? 'FAST INVESTMENT'

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
            aria-label="فتح القائمة الرئيسية"
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-[var(--fi-soft)] text-[var(--fi-emerald)] transition hover:bg-[var(--fi-soft)]/80 lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--fi-emerald)]">{tenantName}</p>
            <h1 className="mt-1 truncate text-sm font-black text-[var(--fi-ink)] sm:text-lg">مركز القيادة العقاري</h1>
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
              <span className="truncate">ابحث عن عميل، صفقة، وحدة، أو أمر</span>
            </span>
            <span className="rounded-md border border-[var(--fi-line)] bg-[var(--fi-soft)] px-2 py-1 text-[10px] text-[var(--fi-muted)]">Ctrl K</span>
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <ThemeToggle />
          <NotificationBell userId={profile.id} />
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex size-10 items-center justify-center rounded-lg border border-[var(--fi-line)] bg-white text-[var(--fi-emerald)] dark:bg-white/5 md:hidden"
            aria-label="فتح البحث"
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
            aria-label="فتح لوحة الأوامر"
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
    super_admin: 'مدير النظام',
    platform_admin: 'مدير المنصة',
    company_owner: 'مالك شركة',
    company_admin: 'مدير شركة',
    admin: 'مدير',
    company: 'شركة',
    broker: 'وسيط',
    agent: 'وسيط',
    customer_support: 'الدعم',
    finance_officer: 'المالية',
    CLIENT: 'عميل',
    client: 'عميل',
  }

  return labels[role] ?? role
}
