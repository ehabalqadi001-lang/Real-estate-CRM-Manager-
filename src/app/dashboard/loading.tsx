export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-[#F4F6F9]" dir="rtl">
      {/* Main content skeleton */}
      <div className="flex-1 p-6 space-y-5 overflow-hidden">
        <div className="h-8 w-56 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          <div className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      </div>
      {/* Sidebar skeleton — right side (RTL) */}
      <div className="hidden lg:flex w-[260px] bg-[#0C1A2E] h-screen shrink-0 flex-col p-4 space-y-3">
        <div className="h-10 w-36 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-16 w-full bg-white/[0.04] rounded-xl border border-white/[0.06] animate-pulse mt-2" />
        <div className="mt-2 space-y-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-9 w-full bg-white/[0.04] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
