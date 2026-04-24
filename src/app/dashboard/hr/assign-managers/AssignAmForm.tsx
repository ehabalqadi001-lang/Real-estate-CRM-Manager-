'use client'

import { useActionState } from 'react'
import { assignAmToBroker, removeAmFromBroker, type AssignAmState } from './actions'

type AmOption = { id: string; full_name: string | null; email: string | null; role: string | null }

const initialState: AssignAmState = { success: false, message: '' }

export function AssignAmForm({
  brokerProfileId,
  currentAmId,
  amOptions,
}: {
  brokerProfileId: string
  currentAmId: string | null
  amOptions: AmOption[]
}) {
  const [state, action, isPending] = useActionState(assignAmToBroker, initialState)

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="brokerProfileId" value={brokerProfileId} />
      <div className="flex gap-2">
        <select
          name="accountManagerId"
          defaultValue={currentAmId ?? ''}
          required
          className="h-9 flex-1 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] px-2 text-xs font-semibold outline-none focus:border-[var(--fi-emerald)] min-w-0"
        >
          <option value="">اختر Account Manager…</option>
          {amOptions.map((am) => (
            <option key={am.id} value={am.id}>{am.full_name ?? am.email}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="h-9 shrink-0 rounded-lg bg-[var(--fi-emerald)] px-3 text-xs font-black text-white disabled:opacity-60 hover:opacity-90"
        >
          {isPending ? '…' : currentAmId ? 'تغيير' : 'تعيين'}
        </button>
      </div>
      {state.message && (
        <p className={`text-[11px] font-bold ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
    </form>
  )
}

export function RemoveAmForm({ brokerProfileId }: { brokerProfileId: string }) {
  const [state, action, isPending] = useActionState(removeAmFromBroker, initialState)

  return (
    <form action={action}>
      <input type="hidden" name="brokerProfileId" value={brokerProfileId} />
      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-full rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-black text-red-600 disabled:opacity-60 hover:bg-red-100"
      >
        {isPending ? '…' : 'إلغاء التعيين'}
      </button>
      {state.message && !state.success && (
        <p className="mt-1 text-[11px] font-bold text-red-600">{state.message}</p>
      )}
    </form>
  )
}
