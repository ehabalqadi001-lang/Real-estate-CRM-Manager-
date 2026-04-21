export default function DashboardLoading() {
  return (
    <div className="fi-shell-bg flex min-h-screen text-[var(--fi-ink)]" dir="rtl" aria-busy="true">
      {/* Main content skeleton */}
      <div className="flex-1 p-6 space-y-5 overflow-hidden">
        <div className="h-8 w-56 rounded-xl ds-skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] ds-skeleton" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-48 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] ds-chart-shimmer" />
          <div className="h-48 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] ds-chart-shimmer" />
        </div>
        <div className="h-64 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] ds-chart-shimmer" />
      </div>
      {/* Sidebar skeleton — right side (RTL) */}
      <div className="hidden lg:flex w-[260px] bg-[#0C1A2E] h-screen shrink-0 flex-col p-4 space-y-3">
        <div className="h-10 w-36 rounded-lg bg-white/10 ds-skeleton" />
        <div className="h-16 w-full rounded-lg border border-white/[0.06] bg-white/[0.04] ds-skeleton mt-2" />
        <div className="mt-2 space-y-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-9 w-full rounded-lg bg-white/[0.04] ds-skeleton" />
          ))}
        </div>
      </div>
    </div>
  )
}
