'use client'

import { useCountUp } from '@/hooks/use-count-up'

type AnimatedCountProps = {
  value: number
  locale?: string
  suffix?: string
  prefix?: string
  compact?: boolean
  decimals?: number
}

export function AnimatedCount({
  value,
  locale = 'ar-EG',
  suffix,
  prefix,
  compact = false,
  decimals = 0,
}: AnimatedCountProps) {
  const count = useCountUp(value, { decimals })
  const formatted = new Intl.NumberFormat(locale, {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(count)

  return (
    <span className="fi-tabular" dir="auto">
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
