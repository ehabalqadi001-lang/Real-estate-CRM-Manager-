'use client'

import { useState } from 'react'
import { Loader2, Play } from 'lucide-react'

type ProcessResult = {
  processed: number
  failed: number
  createdProjects: number
  createdUnits: number
  updatedUnits: number
}

export function BatchProcessButton({ batchId }: { batchId: string }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function processBatch() {
    setPending(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/inventory/import/${batchId}/process`, { method: 'POST' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'تعذر معالجة الملف.')

      const result = payload as ProcessResult
      setMessage(`تم: ${result.processed}، فشل: ${result.failed}، وحدات جديدة: ${result.createdUnits}، تحديثات: ${result.updatedUnits}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر معالجة الملف.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={processBatch}
        disabled={pending}
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-xs font-black text-[var(--fi-ink)] transition hover:border-[var(--fi-emerald)] disabled:opacity-60 dark:bg-white/5"
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
        معالجة
      </button>
      {message ? <p className="max-w-[220px] text-xs font-bold leading-5 text-[var(--fi-muted)]">{message}</p> : null}
    </div>
  )
}
