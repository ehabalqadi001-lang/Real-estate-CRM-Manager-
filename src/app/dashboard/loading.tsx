export default function DashboardLoading() {
  return (
    <div className="fi-shell-bg flex h-screen overflow-hidden text-[var(--fi-ink)]" aria-busy="true">
      {/* Sidebar skeleton — left side, matches DashboardShell layout */}
      {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
      <div className="hidden lg:block" style={{ width: 268, padding: 12, flexShrink: 0 }}>
        {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
        <div className="h-full w-full overflow-hidden rounded-2xl shadow-[0_28px_80px_rgba(0,0,0,0.18)]"
             style={{ background: 'linear-gradient(180deg,#0c1a2e 0%,#0f2040 100%)' }}>
          <div className="flex flex-col h-full p-4 space-y-3">
            {/* Logo row */}
            <div className="flex items-center gap-3 h-[64px] border-b border-white/10 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/10 ds-skeleton shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-white/10 rounded ds-skeleton" />
                <div className="h-2 w-20 bg-white/10 rounded ds-skeleton" />
              </div>
            </div>
            {/* Profile card */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 ds-skeleton">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-24 bg-white/10 rounded" />
                  <div className="h-2 w-16 bg-white/10 rounded" />
                </div>
              </div>
            </div>
            {/* Nav items */}
            <div className="space-y-1 mt-1">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-9 w-full rounded-xl bg-white/[0.04] ds-skeleton" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-hidden min-w-0">
        <div className="h-8 w-56 rounded-xl ds-skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] ds-skeleton" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-48 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] ds-chart-shimmer" />
          <div className="h-48 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] ds-chart-shimmer" />
        </div>
        <div className="h-64 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] ds-chart-shimmer" />
      </div>
    </div>
  )
}
