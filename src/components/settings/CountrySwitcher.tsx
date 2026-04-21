'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Globe2, Loader2 } from 'lucide-react'
import { COUNTRIES, type CountryCode } from '@/config/countries'

type CountrySwitcherProps = {
  initialCountry: CountryCode
}

export function CountrySwitcher({ initialCountry }: CountrySwitcherProps) {
  const router = useRouter()
  const [country, setCountry] = useState<CountryCode>(initialCountry)
  const [isPending, startTransition] = useTransition()

  function changeCountry(nextCountry: CountryCode) {
    setCountry(nextCountry)
    startTransition(async () => {
      await fetch('/api/set-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: nextCountry }),
      })
      router.refresh()
    })
  }

  return (
    <section className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm" dir="rtl">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--fi-line)] pb-4">
        <div className="flex items-center gap-2">
          <Globe2 className="size-5 text-[var(--fi-emerald)]" />
          <div>
            <h2 className="font-black text-[var(--fi-ink)]">الدولة والعملة</h2>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">تحدد العملة، الضريبة، أرقام الهاتف، واللغة المحلية.</p>
          </div>
        </div>
        {isPending ? <Loader2 className="size-4 animate-spin text-[var(--fi-emerald)]" /> : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => {
          const item = COUNTRIES[code]
          const active = country === code
          return (
            <button
              key={code}
              type="button"
              onClick={() => changeCountry(code)}
              className={active
                ? 'rounded-lg border border-[var(--fi-emerald)] bg-[var(--fi-soft)] p-3 text-right ring-2 ring-[var(--fi-emerald)]/15'
                : 'rounded-lg border border-[var(--fi-line)] bg-white p-3 text-right transition hover:bg-[var(--fi-soft)]'}
            >
              <span className="block text-sm font-black text-[var(--fi-ink)]">{item.name}</span>
              <span className="mt-1 block text-xs font-bold text-[var(--fi-muted)]">{item.currencySymbol} · {item.phone}</span>
              <span className="mt-2 block text-[11px] font-semibold text-[var(--fi-muted)]">{item.regulatoryBody}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
