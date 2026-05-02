export default function UnitDetailLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl animate-pulse">
      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
            <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-9 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
