import { Building2 } from 'lucide-react'
import { requireSession } from '@/shared/auth/session'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'المخزون | FAST INVESTMENT' }

export default async function InventoryPage() {
  await requireSession()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">المخزون المتاح</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">استعرض الوحدات والمشاريع المتاحة للبيع</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 text-center">
        <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">قريباً</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          سيتاح عرض المخزون المتاح قريباً
        </p>
      </div>
    </div>
  )
}
