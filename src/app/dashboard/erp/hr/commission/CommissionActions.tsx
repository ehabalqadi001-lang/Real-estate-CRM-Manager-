'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { approveCommissionAction, rejectCommissionAction, syncCRMDealsAction } from './actions'

export function CommissionApproveButton({ dealId }: { dealId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await approveCommissionAction(dealId) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
    >
      <CheckCircle2 className="size-3.5" />
      {pending ? 'جاري...' : 'إقرار'}
    </button>
  )
}

export function CommissionRejectButton({ dealId }: { dealId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => {
        const reason = window.prompt('سبب الرفض (اختياري):') ?? ''
        startTransition(async () => { await rejectCommissionAction(dealId, reason) })
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
    >
      <XCircle className="size-3.5" />
      {pending ? 'جاري...' : 'رفض'}
    </button>
  )
}

export function SyncCRMButton() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await syncCRMDealsAction()
            setResult(res)
          })
        }
        className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--fi-line)] bg-white px-4 text-sm font-black text-[var(--fi-ink)] transition hover:border-[var(--fi-emerald)] disabled:opacity-60 dark:bg-white/5"
      >
        <RefreshCw className={`size-4 ${pending ? 'animate-spin' : ''}`} />
        {pending ? 'جاري المزامنة...' : 'مزامنة صفقات CRM'}
      </button>
      {result && (
        <p className={`text-xs font-bold ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {result.message}
        </p>
      )}
    </div>
  )
}
