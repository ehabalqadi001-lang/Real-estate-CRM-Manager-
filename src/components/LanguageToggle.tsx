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
      className="flex w-full items-center justify-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      title="تبديل اللغة / Switch Language"
    >
      {isPending ? '...' : 'EN | ع'}
    </button>
  )
}
