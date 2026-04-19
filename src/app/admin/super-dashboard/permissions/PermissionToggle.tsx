'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { removePermissionOverride, upsertPermissionOverride } from './actions'

interface Props {
  userId: string
  permissionId: string
  permissionKey: string
  currentState: 'granted' | 'revoked' | 'default'
  defaultGranted: boolean
}

const STATE_CLASSES = {
  granted: 'border-[#27AE60] bg-[#27AE60] text-white shadow-sm',
  revoked: 'border-red-200 bg-red-50 text-red-700',
  default: 'border-slate-200 bg-slate-50 text-slate-500',
}

export function PermissionToggle({
  userId,
  permissionId,
  permissionKey,
  currentState,
  defaultGranted,
}: Props) {
  const router = useRouter()
  const [state, setState] = useState(currentState)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const label = useMemo(() => {
    if (state === 'granted') return '✓'
    if (state === 'revoked') return '×'
    return defaultGranted ? '~' : '—'
  }, [defaultGranted, state])

  const title =
    state === 'granted'
      ? 'ممنوحة كاستثناء. اضغط للمنع.'
      : state === 'revoked'
        ? 'ممنوعة كاستثناء. اضغط للعودة للوضع الافتراضي.'
        : defaultGranted
          ? 'ممنوحة افتراضياً من الدور. اضغط لتثبيتها كاستثناء.'
          : 'غير ممنوحة افتراضياً. اضغط للمنح.'

  function cycle() {
    const previousState = state
    const nextState = state === 'default' ? 'granted' : state === 'granted' ? 'revoked' : 'default'
    setState(nextState)
    setError(null)

    startTransition(async () => {
      const fd = new FormData()
      fd.set('user_id', userId)
      fd.set('permission_id', permissionId)

      const result =
        previousState === 'default'
          ? await grant(fd)
          : previousState === 'granted'
            ? await revoke(fd)
            : await clear(fd)

      if (result?.error) {
        setState(previousState)
        setError(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <div className="relative flex justify-center">
      <button
        type="button"
        onClick={cycle}
        disabled={pending}
        title={error ?? title}
        aria-label={`${permissionKey}: ${title}`}
        className={`
          flex size-9 items-center justify-center rounded-lg border text-sm font-black transition-all duration-150
          ${STATE_CLASSES[state]}
          ${pending ? 'cursor-wait opacity-50' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'}
          ${error ? 'ring-2 ring-red-300' : ''}
        `}
      >
        {pending ? '…' : label}
      </button>
    </div>
  )
}

async function grant(fd: FormData) {
  fd.set('granted', 'true')
  return upsertPermissionOverride(fd)
}

async function revoke(fd: FormData) {
  fd.set('granted', 'false')
  return upsertPermissionOverride(fd)
}

async function clear(fd: FormData) {
  return removePermissionOverride(fd)
}
