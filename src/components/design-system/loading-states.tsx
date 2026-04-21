import { cn } from '@/lib/utils'

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('ds-card p-4', className)} aria-busy="true">
      <div className="ds-skeleton h-4 w-1/2" />
      <div className="ds-skeleton mt-4 h-8 w-2/3" />
      <div className="ds-skeleton mt-4 h-3 w-full" />
      <div className="ds-skeleton mt-2 h-3 w-4/5" />
    </div>
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('ds-card p-4', className)} aria-busy="true">
      <div className="mb-4 flex items-center justify-between">
        <div className="ds-skeleton h-4 w-36" />
        <div className="ds-skeleton h-8 w-24" />
      </div>
      <div className="ds-chart-shimmer" />
    </div>
  )
}

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('ds-card divide-y divide-[var(--color-border)]', className)} aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 p-4">
          <div className="ds-skeleton size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="ds-skeleton h-4 w-2/3" />
            <div className="ds-skeleton mt-2 h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
