'use client'

import { useState } from 'react'
import { markActivityAsDone } from '@/app/dashboard/activities/actions'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

export default function ActivityDoneButton({ activityId }: { activityId: string }) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)

  const handleDone = async () => {
    setIsLoading(true)
    try {
      await markActivityAsDone(activityId)
    } catch (error: unknown) {
      alert(t('حدث خطأ: ', 'Error: ') + (error instanceof Error ? error.message : t('خطأ غير معروف', 'Unknown error')))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleDone}
      disabled={isLoading}
      className="flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-500 text-slate-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all"
    >
      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
      {t('تم الإنجاز', 'Done')}
    </button>
  )
}