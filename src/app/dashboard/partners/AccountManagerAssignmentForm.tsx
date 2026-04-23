'use client'

import { useActionState } from 'react'
import { UserCheck } from 'lucide-react'
import {
  assignPartnerAccountManagerState,
  type PartnerActionState,
} from './actions'

type AccountManagerOption = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

const initialState: PartnerActionState = {
  success: false,
  message: '',
}

export default function AccountManagerAssignmentForm({
  applicationId,
  assignedAccountManagerId,
  accountManagers,
}: {
  applicationId: string
  assignedAccountManagerId: string | null
  accountManagers: AccountManagerOption[]
}) {
  const [state, formAction, pending] = useActionState(assignPartnerAccountManagerState, initialState)
  const hasManagers = accountManagers.length > 0

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-[var(--fi-line)] bg-white p-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          name="accountManagerId"
          defaultValue={assignedAccountManagerId ?? ''}
          disabled={!hasManagers || pending}
          className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-400"
          required
        >
          <option value="" disabled>
            {hasManagers ? 'اختر Account Manager' : 'لا يوجد Account Manager متاح'}
          </option>
          {accountManagers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.full_name || manager.email || manager.role || 'Account Manager'}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!hasManagers || pending}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0C1A2E] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <UserCheck className="size-4" />
          {pending ? 'جاري التعيين...' : assignedAccountManagerId ? 'إعادة تعيين' : 'تعيين'}
        </button>
      </div>
      {state.message ? (
        <p className={`rounded-lg px-3 py-2 text-xs font-black ${state.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
