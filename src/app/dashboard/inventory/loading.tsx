export default function InventoryLoading() {
  return (
    <main className="space-y-5 p-4 sm:p-6" aria-busy="true">
      <header className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4 shadow-sm">
        <div className="h-8 w-60 rounded-md ds-skeleton" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md ds-skeleton" />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg ds-skeleton" />
              <div className="min-w-0 flex-1">
                <div className="h-3 w-24 rounded-md ds-skeleton" />
                <div className="mt-3 h-6 w-28 rounded-md ds-skeleton" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
          <div className="h-6 w-32 rounded-md ds-skeleton" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index}>
                <div className="h-3 w-24 rounded-md ds-skeleton" />
                <div className="mt-2 h-10 rounded-lg ds-skeleton" />
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-5 w-40 rounded-md ds-skeleton" />
            <div className="flex gap-2">
              <div className="h-9 w-24 rounded-lg ds-skeleton" />
              <div className="h-9 w-24 rounded-lg ds-skeleton" />
              <div className="h-9 w-24 rounded-lg ds-skeleton" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)]">
                <div className="aspect-[4/3] ds-chart-shimmer" />
                <div className="space-y-4 p-4">
                  <div className="h-5 w-44 rounded-md ds-skeleton" />
                  <div className="h-4 w-32 rounded-md ds-skeleton" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, specIndex) => (
                      <div key={specIndex} className="h-7 rounded-md ds-skeleton" />
                    ))}
                  </div>
                  <div className="h-7 w-36 rounded-md ds-skeleton" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {Array.from({ length: 3 }).map((_, actionIndex) => (
                      <div key={actionIndex} className="h-9 rounded-lg ds-skeleton" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
