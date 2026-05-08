export default function MarketingLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 sm:p-6" dir="rtl">
      {/* Header skeleton */}
      <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-700" />

      {/* KPI skeletons */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>

      {/* Department grid skeletons */}
      <div>
        <div className="mb-4 h-5 w-40 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
