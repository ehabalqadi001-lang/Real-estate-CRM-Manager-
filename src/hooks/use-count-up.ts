'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type UseCountUpOptions = {
  duration?: number
  decimals?: number
  enabled?: boolean
}

export function useCountUp(value: number, options: UseCountUpOptions = {}) {
  const { duration = 900, decimals = 0, enabled = true } = options
  const [displayValue, setDisplayValue] = useState(enabled ? 0 : value)
  const previousValueRef = useRef(displayValue)

  useEffect(() => {
    if (!enabled) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) {
      const frame = requestAnimationFrame(() => {
        previousValueRef.current = value
        setDisplayValue(value)
      })
      return () => cancelAnimationFrame(frame)
    }

    let frame = 0
    const startedAt = performance.now()
    const from = previousValueRef.current
    const diff = value - from

    function tick(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = from + diff * eased
      setDisplayValue(nextValue)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        previousValueRef.current = value
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, enabled])

  return useMemo(() => Number((enabled ? displayValue : value).toFixed(decimals)), [displayValue, decimals, enabled, value])
}
