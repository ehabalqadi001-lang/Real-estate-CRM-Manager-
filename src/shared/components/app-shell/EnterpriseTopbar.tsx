'use client'

import { Search, ShieldCheck, Sparkles } from 'lucide-react'
import type { AppProfile } from '@/shared/auth/types'

export function EnterpriseTopbar({ profile }: { profile: AppProfile }) {
  function openCommandPalette() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--fi-line)] bg-[rgba(10,14,26,0.72)] px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--fi-gold)]">FAST INVESTMENT</p>
          <h1 className="mt-1 truncate text-lg font-black text-white">Enterprise Command Center</h1>
        </div>

        <div className="hidden flex-1 justify-center px-8 md:flex">
          <button
            type="button"
            onClick={openCommandPalette}
            className="fi-focus flex h-10 w-full max-w-xl items-center justify-between rounded-lg border border-[var(--fi-line)] bg-white/[0.05] px-3 text-sm font-bold text-[var(--fi-muted)] transition hover:bg-white/[0.08]"
          >
            <span className="flex items-center gap-2">
              <Search className="size-4 text-[var(--fi-gold)]" />
              ابحث عن عميل، صفقة، وحدة، أو أمر
            </span>
            <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/45">Ctrl K</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white/[0.05] px-3 py-2 text-xs font-black text-white sm:flex">
            <ShieldCheck className="size-4 text-[var(--fi-gold)]" />
            {labelRole(profile.role)}
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg border border-[var(--fi-line)] bg-[rgba(201,168,76,0.14)] text-[var(--fi-gold)]">
            <Sparkles className="size-4" />
          </div>
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
  }

  return labels[role] ?? role
}
