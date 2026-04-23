export default function PartnersLoading() {
  return (
    <main className="sales-command space-y-5 p-4 sm:p-6" dir="rtl">
      <section className="sales-hero rounded-3xl p-6">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="sales-skeleton h-4 w-48 bg-white/20" />
          <div className="sales-skeleton h-10 w-3/4 bg-white/20" />
          <div className="sales-skeleton h-4 w-2/3 bg-white/20" />
        </div>
      </section>
      <section className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="sales-kpi rounded-3xl border border-[var(--fi-line)] bg-white p-4">
            <div className="sales-skeleton h-5 w-5" />
            <div className="sales-skeleton mt-4 h-7 w-24" />
            <div className="sales-skeleton mt-3 h-3 w-32" />
          </div>
        ))}
      </section>
      <section className="sales-card rounded-3xl border border-[var(--fi-line)] bg-white p-5">
        <div className="sales-skeleton h-6 w-64" />
        <div className="mt-5 space-y-3">
          <div className="sales-skeleton h-24 w-full rounded-2xl" />
          <div className="sales-skeleton h-24 w-full rounded-2xl" />
          <div className="sales-skeleton h-24 w-full rounded-2xl" />
        </div>
      </section>
    </main>
  )
}
