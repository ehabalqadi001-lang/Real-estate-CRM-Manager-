'use client'

import { useTransition } from 'react'
import { CheckCircle2, XCircle, XSquare } from 'lucide-react'
import { approveLeaveAction, rejectLeaveAction, cancelLeaveAction } from './actions'

export function ApproveLeaveButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await approveLeaveAction(requestId) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
    >
      <CheckCircle2 className="size-3.5" />
      {pending ? '...' : 'موافقة'}
    </button>
  )
}

export function RejectLeaveButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => {
        const notes = window.prompt('سبب الرفض (اختياري):') ?? ''
        startTransition(async () => { await rejectLeaveAction(requestId, notes) })
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
    >
      <XCircle className="size-3.5" />
      {pending ? '...' : 'رفض'}
    </button>
  )
}

export function CancelLeaveButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await cancelLeaveAction(requestId) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
    >
      <XSquare className="size-3.5" />
      {pending ? '...' : 'إلغاء'}
    </button>
  )
}
