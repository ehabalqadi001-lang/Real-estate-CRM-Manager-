'use client'

import { useTransition } from 'react'
import { Building2, Loader2 } from 'lucide-react'
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

  if (companies.length === 0) return null

  return (
    <label className="hidden min-w-[210px] items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-3 py-2 text-xs font-black text-[var(--fi-ink)] dark:bg-white/5 lg:flex">
      <Building2 className="size-4 shrink-0 text-[var(--fi-emerald)]" aria-hidden="true" />
      <span className="sr-only">الشركة النشطة</span>
      <select
        value={activeCompanyId ?? ''}
        disabled={isPending}
        onChange={(event) => {
          const nextCompanyId = event.target.value
          startTransition(async () => {
            const result = await selectActiveCompanyAction(nextCompanyId)
            if (result.success) router.refresh()
            if (!result.success && result.error) window.alert(result.error)
          })
        }}
        className="min-w-0 flex-1 bg-transparent text-right outline-none disabled:cursor-wait"
        aria-label="اختيار الشركة النشطة"
      >
        <option value="" disabled>
          اختر شركة
        </option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
      {isPending ? <Loader2 className="size-4 shrink-0 animate-spin text-[var(--fi-emerald)]" aria-hidden="true" /> : null}
    </label>
  )
}
