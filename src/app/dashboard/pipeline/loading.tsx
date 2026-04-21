export default function PipelineLoading() {
  return (
    <main className="px-3 py-4 sm:px-4 lg:px-6" dir="rtl" aria-busy="true">
      <section className="space-y-4">
        <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
          <div className="h-6 w-28 rounded-md ds-skeleton" />
          <div className="mt-4 h-8 w-56 rounded-md ds-skeleton" />
          <div className="mt-3 h-4 w-full max-w-xl rounded-md ds-skeleton" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3">
                <div className="h-3 w-24 rounded-md ds-skeleton" />
                <div className="mt-3 h-7 w-32 rounded-md ds-skeleton" />
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-10 rounded-lg ds-skeleton" />
            ))}
          </div>
        </div>

        <div className="flex gap-3 overflow-hidden pb-4">
          {Array.from({ length: 4 }).map((_, columnIndex) => (
            <div key={columnIndex} className="flex min-h-[560px] w-[310px] shrink-0 flex-col rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)]">
              <div className="border-b border-[var(--fi-line)] p-3">
                <div className="h-5 w-28 rounded-md ds-skeleton" />
                <div className="mt-3 h-3 w-24 rounded-md ds-skeleton" />
              </div>
              <div className="flex-1 space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, cardIndex) => (
                  <div key={cardIndex} className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3">
                    <div className="h-4 w-36 rounded-md ds-skeleton" />
                    <div className="mt-3 h-3 w-48 rounded-md ds-skeleton" />
                    <div className="mt-4 flex justify-between gap-3">
                      <div className="h-6 w-20 rounded-md ds-skeleton" />
                      <div className="h-6 w-24 rounded-md ds-skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
