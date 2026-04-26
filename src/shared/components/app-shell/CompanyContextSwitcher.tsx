'use client'

import { useTransition, useState } from 'react'
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CompanyOption } from '@/shared/company-context/server'
import { selectActiveCompanyAction } from '@/shared/company-context/actions'

type CompanyContextSwitcherProps = {
  activeCompanyId: string | null
  companies: CompanyOption[]
}

export function CompanyContextSwitcher({ activeCompanyId, companies }: CompanyContextSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  if (companies.length === 0) return null

  const active = companies.find((c) => c.id === activeCompanyId) ?? companies[0]

  function select(companyId: string) {
    setOpen(false)
    startTransition(async () => {
      const result = await selectActiveCompanyAction(companyId)
      if (result.success) router.refresh()
      if (!result.success && result.error) window.alert(result.error)
    })
  }

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-[210px] items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2 text-xs font-black text-[var(--fi-ink)] transition hover:border-emerald-300 disabled:cursor-wait dark:bg-white/5"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose active company"
      >
        <Building2 className="size-4 shrink-0 text-[var(--fi-emerald)]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left">{active?.name ?? 'Choose company'}</span>
        {isPending
          ? <Loader2 className="size-3.5 shrink-0 animate-spin text-[var(--fi-emerald)]" aria-hidden="true" />
          : <ChevronDown className="size-3.5 shrink-0 text-[var(--fi-muted)]" aria-hidden="true" />
        }
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul
            role="listbox"
            aria-label="Companies"
            className="absolute right-0 top-full z-50 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-xl border border-[var(--fi-line)] bg-white py-1 shadow-xl dark:bg-slate-900"
          >
            {companies.map((company) => {
              const isActive = company.id === activeCompanyId
              return (
                <li
                  key={company.id}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => select(company.id)}
                  className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-[var(--fi-ink)] hover:bg-[var(--fi-soft)] aria-selected:bg-emerald-50 aria-selected:text-emerald-700 dark:hover:bg-white/5 dark:aria-selected:bg-emerald-900/30"
                >
                  <Check className={`size-3.5 shrink-0 ${isActive ? 'text-[var(--fi-emerald)]' : 'opacity-0'}`} aria-hidden="true" />
                  <span className="truncate">{company.name}</span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
