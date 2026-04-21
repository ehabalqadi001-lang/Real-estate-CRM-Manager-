import type { ReactNode } from 'react'

type BentoDashboardLayoutProps = {
  main: ReactNode
  sidebar: ReactNode
}

export function BentoDashboardLayout({ main, sidebar }: BentoDashboardLayoutProps) {
  return (
    <section className="ds-bento-grid ds-page-enter" dir="rtl">
      <div className="ds-bento-main min-w-0">
        {main}
      </div>
      <aside className="ds-bento-sidebar min-w-0">
        {sidebar}
      </aside>
    </section>
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
