'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'

interface LocaleOption {
  code: string
  label: string
  dir: 'rtl' | 'ltr'
}

const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'ar-EG', label: 'العربية (مصر)', dir: 'rtl' },
  { code: 'ar-SA', label: 'العربية (السعودية)', dir: 'rtl' },
  { code: 'ar-AE', label: 'العربية (الإمارات)', dir: 'rtl' },
  { code: 'en-US', label: 'English (US)', dir: 'ltr' },
]

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current =
    LOCALE_OPTIONS.find((l) => l.code === locale) ??
    LOCALE_OPTIONS.find((l) => l.code.startsWith(locale.slice(0, 2))) ??
    LOCALE_OPTIONS[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function switchLocale(code: string) {
    document.cookie = `locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    setOpen(false)
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={current.label}
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-10 items-center gap-1.5 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-2.5 text-sm font-semibold text-[var(--fi-muted)] transition hover:border-emerald-300 hover:text-[var(--fi-ink)] dark:bg-white/5 dark:hover:border-emerald-700"
      >
        <Globe className="size-4 shrink-0 text-[var(--fi-emerald)]" aria-hidden />
        <span className="hidden sm:block max-w-[120px] truncate">{current.label}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute end-0 top-12 z-50 min-w-[200px] overflow-hidden rounded-xl border border-[var(--fi-line)] bg-white shadow-xl dark:bg-slate-900"
        >
          {LOCALE_OPTIONS.map((option) => {
            const isActive = option.code === locale || (locale.startsWith('ar') && !LOCALE_OPTIONS.some(l => l.code === locale) && option.code === 'ar-EG')
            return (
              <button
                key={option.code}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => switchLocale(option.code)}
                dir={option.dir}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-semibold transition hover:bg-[var(--fi-soft)] ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-[var(--fi-ink)] dark:text-slate-200'
                }`}
              >
                <span>{option.label}</span>
                {isActive && <Check className="size-4 shrink-0 text-emerald-600" aria-hidden />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
