export default function SkillsLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 sm:p-6" dir="rtl">
      <div className="h-16 w-72 rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  )
}
