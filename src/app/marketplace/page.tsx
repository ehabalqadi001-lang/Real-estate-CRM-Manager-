import { Suspense } from 'react'
import { Metadata } from 'next'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import PropertyGrid from '@/components/marketplace/PropertyGrid'
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'سوق العقارات | Fast Investment CRM',
  description: 'تصفح واستكشف آلاف العقارات المتاحة للبيع والشراء في السوق المصري',
}

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <MarketplaceHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy dark:text-white mb-4 text-center">
            سوق العقارات
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 text-center max-w-2xl mx-auto">
            اكتشف فرص الاستثمار العقاري الأفضل في السوق المصري مع ضمان الجودة والأمان
          </p>
        </div>

        <MarketplaceFilters />

        <Suspense fallback={<PropertyGridSkeleton />}>
          <PropertyGrid />
        </Suspense>
      </main>
    </div>
  )
}

function PropertyGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <Skeleton className="h-48 w-full rounded-lg mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  )
}