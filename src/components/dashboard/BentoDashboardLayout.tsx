import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BentoDashboardLayoutProps = {
  main: ReactNode
  sidebar: ReactNode
  kpis?: ReactNode
  className?: string
}

type BentoCardProps = {
  children: ReactNode
  className?: string
  area?: 'main' | 'sidebar' | 'kpi' | 'full'
  interactive?: boolean
}

export function BentoDashboardLayout({ main, sidebar, kpis, className }: BentoDashboardLayoutProps) {
  return (
    <section className={cn('ds-bento-grid ds-page-enter', className)} dir="rtl">
      {kpis}
      <div className="ds-bento-main min-w-0">
        {main}
      </div>
      <aside className="ds-bento-sidebar min-w-0">
        {sidebar}
      </aside>
    </section>
  )
}

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('ds-bento-grid ds-page-enter', className)} dir="rtl">
      {children}
    </section>
  )
}

export function BentoCard({ children, className, area = 'full', interactive = true }: BentoCardProps) {
  const areaClass = {
    main: 'ds-bento-main',
    sidebar: 'ds-bento-sidebar',
    kpi: 'ds-bento-kpi',
    full: 'ds-bento-full',
  }[area]

  return (
    <div className={cn('ds-card p-4 sm:p-5', areaClass, interactive && 'ds-card-hover', className)}>
      {children}
    </div>
  )
}

export function BentoKpiCard({
  title,
  value,
  hint,
  icon,
  trend,
}: {
  title: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  trend?: ReactNode
}) {
  return (
    <BentoCard area="kpi" className="min-h-[132px]">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-black text-[var(--color-text-muted)]">{title}</p>
          {icon ? (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-brand-emerald)]">
              {icon}
            </span>
          ) : null}
        </div>
        <div>
          <div className="fi-tabular text-2xl font-black leading-none text-[var(--color-text)]">{value}</div>
          <div className="mt-2 flex min-h-5 items-center justify-between gap-2 text-xs font-bold text-[var(--color-text-muted)]">
            <span>{hint}</span>
            {trend}
          </div>
        </div>
      </div>
    </BentoCard>
  )
}

export function BentoSkeleton() {
  return (
    <section className="ds-bento-grid" dir="rtl" aria-label="جاري تحميل لوحة التحكم">
      <div className="ds-bento-kpi h-32 ds-skeleton" />
      <div className="ds-bento-kpi h-32 ds-skeleton" />
      <div className="ds-bento-kpi h-32 ds-skeleton" />
      <div className="ds-bento-kpi h-32 ds-skeleton" />
      <div className="ds-bento-main ds-chart-shimmer" />
      <div className="ds-bento-sidebar h-[420px] ds-skeleton" />
    </section>
  )
}
