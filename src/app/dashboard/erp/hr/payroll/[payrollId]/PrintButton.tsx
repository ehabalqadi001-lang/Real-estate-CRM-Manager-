'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 py-2 text-sm font-bold text-[var(--fi-muted)] hover:text-[var(--fi-ink)] transition print:hidden"
    >
      <Printer size={15} />
      طباعة
    </button>
  )
}
