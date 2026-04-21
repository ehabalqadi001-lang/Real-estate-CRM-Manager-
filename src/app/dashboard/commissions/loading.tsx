export default function CommissionsLoading() {
  return (
    <main className="px-3 py-4 sm:px-4 lg:px-6" dir="rtl" aria-busy="true">
      <section className="space-y-4">
        <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="h-4 w-40 rounded-md ds-skeleton" />
              <div className="mt-3 h-8 w-64 rounded-md ds-skeleton" />
              <div className="mt-3 h-4 w-full max-w-xl rounded-md ds-skeleton" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-10 w-28 rounded-lg ds-skeleton" />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
              <div className="h-3 w-24 rounded-md ds-skeleton" />
              <div className="mt-3 h-7 w-32 rounded-md ds-skeleton" />
            </div>
          ))}
        </div>

        <div className="grid gap-2 rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 rounded-lg ds-skeleton" />
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)]">
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid min-w-[980px] grid-cols-9 gap-3">
                {Array.from({ length: 9 }).map((_, cellIndex) => (
                  <div key={cellIndex} className="h-8 rounded-md ds-skeleton" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
