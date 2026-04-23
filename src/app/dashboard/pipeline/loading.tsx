export default function PipelineLoading() {
  return (
    <main className="sales-command p-4 sm:p-6" dir="rtl">
      <div className="sales-command-shell space-y-5">
        <section className="sales-hero rounded-3xl p-6">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="sales-skeleton h-4 w-40 bg-white/20" />
            <div className="sales-skeleton h-10 w-3/4 bg-white/20" />
            <div className="sales-skeleton h-4 w-2/3 bg-white/20" />
          </div>
        </section>
        <section className="sales-card rounded-3xl border border-[var(--fi-line)] bg-white p-5">
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[var(--fi-line)] p-4">
                <div className="sales-skeleton h-3 w-24" />
                <div className="sales-skeleton mt-4 h-8 w-32" />
              </div>
            ))}
          </div>
        </section>
        <section className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="sales-stage-column h-[520px] w-[320px] shrink-0 rounded-3xl border border-[var(--fi-line)] p-4">
              <div className="sales-skeleton h-5 w-28" />
              <div className="mt-6 space-y-3">
                <div className="sales-skeleton h-28 w-full rounded-2xl" />
                <div className="sales-skeleton h-28 w-full rounded-2xl" />
                <div className="sales-skeleton h-28 w-full rounded-2xl" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
