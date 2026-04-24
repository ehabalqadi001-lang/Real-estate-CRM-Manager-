'use client'

import { Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

export function BrokerSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-[var(--fi-emerald)] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          جاري رفع البيع...
        </span>
      ) : (
        'رفع البيع للمراجعة'
      )}
    </button>
  )
}
