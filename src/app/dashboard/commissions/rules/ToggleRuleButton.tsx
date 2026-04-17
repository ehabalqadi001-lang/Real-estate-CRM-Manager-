'use client'

import { useTransition } from 'react'
import { toggleRule } from './actions'

export default function ToggleRuleButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleRule(id, isActive))}
      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
      }`}
    >
      {pending ? '...' : isActive ? 'تعطيل' : 'تفعيل'}
    </button>
  )
}
