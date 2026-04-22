'use client'

import { useState } from 'react'
import { Ban, Loader2 } from 'lucide-react'
import { suspendDeveloperAccountAction } from './actions'

export function SuspendDeveloperAccountButton({ accountId }: { accountId: string }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function suspend() {
    setPending(true)
    setMessage(null)
    const result = await suspendDeveloperAccountAction(accountId)
    setMessage(result.message)
    setPending(false)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={suspend}
        disabled={pending}
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : <Ban className="size-3" />}
        تعليق
      </button>
      {message ? <p className="text-xs font-bold text-[var(--fi-muted)]">{message}</p> : null}
    </div>
  )
}
