'use client'

import { useTransition } from 'react'
import { upsertPermissionOverride, removePermissionOverride } from './actions'

interface Props {
  userId: string
  permissionId: string
  permissionKey: string
  currentState: 'granted' | 'revoked' | 'default'
  defaultGranted: boolean
}

const STATE_CLASSES = {
  granted: 'bg-[#0F8F83] text-white border-[#0F8F83]',
  revoked: 'bg-red-100 text-red-700 border-red-300',
  default: 'bg-slate-100 text-slate-500 border-slate-200',
}

export function PermissionToggle({
  userId,
  permissionId,
  permissionKey: _permissionKey,
  currentState,
  defaultGranted,
}: Props) {
  const [pending, startTransition] = useTransition()

  const cycle = () => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('user_id', userId)
      fd.set('permission_id', permissionId)

      if (currentState === 'default') {
        // grant explicitly
        fd.set('granted', 'true')
        await upsertPermissionOverride(fd)
      } else if (currentState === 'granted') {
        // revoke explicitly
        fd.set('granted', 'false')
        await upsertPermissionOverride(fd)
      } else {
        // remove override → back to default
        await removePermissionOverride(fd)
      }
    })
  }

  const label = currentState === 'granted' ? '✓' : currentState === 'revoked' ? '✗' : defaultGranted ? '~' : '—'
  const title =
    currentState === 'granted'
      ? 'Override: Granted (click to revoke)'
      : currentState === 'revoked'
        ? 'Override: Revoked (click to clear)'
        : defaultGranted
          ? 'Default: granted by role (click to explicitly grant)'
          : 'Default: no access (click to grant)'

  return (
    <button
      onClick={cycle}
      disabled={pending}
      title={title}
      className={`
        h-7 w-7 rounded border text-xs font-black transition-all duration-150
        ${STATE_CLASSES[currentState]}
        ${pending ? 'opacity-40 cursor-wait' : 'cursor-pointer hover:scale-110'}
      `}
    >
      {pending ? '…' : label}
    </button>
  )
}
