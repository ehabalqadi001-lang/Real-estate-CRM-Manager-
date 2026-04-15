'use client'

import { useState } from 'react'
import { markActivityAsDone } from '@/app/dashboard/activities/actions'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function ActivityDoneButton({ activityId }: { activityId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDone = async () => {
    setIsLoading(true)
    try {
      await markActivityAsDone(activityId)
    } catch (error: any) {
      alert("حدث خطأ: " + error.message)
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
      تم الإنجاز
    </button>
  )
}