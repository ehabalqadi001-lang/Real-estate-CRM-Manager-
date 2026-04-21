'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock3 } from 'lucide-react'

interface HoldTimerProps {
  heldUntil: string | null
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return new Intl.NumberFormat('ar-EG', { minimumIntegerDigits: 2 }).format(hours)
    + ':'
    + new Intl.NumberFormat('ar-EG', { minimumIntegerDigits: 2 }).format(minutes)
    + ':'
    + new Intl.NumberFormat('ar-EG', { minimumIntegerDigits: 2 }).format(seconds)
}

export function HoldTimer({ heldUntil }: HoldTimerProps) {
  const target = useMemo(() => (heldUntil ? new Date(heldUntil).getTime() : 0), [heldUntil])
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()))

  useEffect(() => {
    if (!target) return
    const interval = window.setInterval(() => {
      setRemaining(Math.max(0, target - Date.now()))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [target])

  if (!heldUntil || remaining <= 0) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--fi-line)] bg-[var(--fi-soft)] px-2 py-1 text-xs font-bold text-[var(--fi-ink)]">
      <Clock3 className="size-3.5" />
      {formatTime(remaining)}
    </span>
  )
}
