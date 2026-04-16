'use client'

import { useTransition } from 'react'

export default function LanguageToggle() {
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch('/api/set-locale', { method: 'POST' })
      if (res.ok) {
        window.location.reload()
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50"
      title="تبديل اللغة / Switch Language"
    >
      {isPending ? '...' : 'EN | ع'}
    </button>
  )
}
