'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { revokeDeveloperProjectAccessAction } from './actions'

export function RevokeDeveloperProjectAccessButton({ accessId }: { accessId: string }) {
  const [pending, setPending] = useState(false)

  async function revoke() {
    setPending(true)
    await revokeDeveloperProjectAccessAction(accessId)
    setPending(false)
  }

  return (
    <button
      type="button"
      onClick={revoke}
      disabled={pending}
      className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 disabled:opacity-60"
    >
      <Trash2 className="size-3" aria-hidden="true" />
      حذف
    </button>
  )
}
