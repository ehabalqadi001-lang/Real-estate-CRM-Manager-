'use client'

import { useEffect, useMemo, useState } from 'react'

type UseCountUpOptions = {
  duration?: number
  decimals?: number
  enabled?: boolean
}

export function useCountUp(value: number, options: UseCountUpOptions = {}) {
  const { duration = 900, decimals = 0, enabled = true } = options
  const [displayValue, setDisplayValue] = useState(enabled ? 0 : value)

  useEffect(() => {
    if (!enabled) {
      setDisplayValue(value)
      return
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) {
      setDisplayValue(value)
      return
    }

    let frame = 0
    const startedAt = performance.now()
    const from = displayValue
    const diff = value - from

    function tick(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(from + diff * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, enabled])

  return useMemo(() => Number(displayValue.toFixed(decimals)), [displayValue, decimals])
}
