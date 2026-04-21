'use client'

import { useEffect, useState } from 'react'

export function useCountUp(target: number, duration = 850) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const from = 0
    let frame = 0

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, target])

  return value
}
