'use client'

import { useState, useTransition } from 'react'
import { Sparkles, CheckCircle } from 'lucide-react'
import { rescoreAllLeads } from './scoring'

export default function RescoreButton() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<number | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const { updated } = await rescoreAllLeads()
      setResult(updated)
      setTimeout(() => setResult(null), 4000)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 disabled:opacity-60 transition-colors"
    >
      {result != null ? (
        <>
          <CheckCircle size={14} className="text-emerald-500" />
          <span className="text-emerald-600">تم تحديث {result} عميل</span>
        </>
      ) : (
        <>
          <Sparkles size={14} className={pending ? 'animate-pulse text-amber-500' : 'text-amber-500'} />
          {pending ? 'جاري التقييم...' : 'تقييم ذكي'}
        </>
      )}
    </button>
  )
}
