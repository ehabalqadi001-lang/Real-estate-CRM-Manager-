'use client'

import { useState } from 'react'
import { Star, Send, ExternalLink } from 'lucide-react'

interface Score {
  score: number
  agent_rating?: number
  comment?: string
}

export default function SatisfactionScore({ dealId, initial }: { dealId: string; initial: Score | null }) {
  const [copied, setCopied] = useState(false)

  const surveyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/survey/${dealId}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(surveyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderStars = (n: number) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= n ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} />
      ))}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
        <Star size={15} className="text-yellow-500" /> تقييم رضا العميل
      </h3>

      {initial ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">التقييم العام</p>
            {renderStars(initial.score)}
          </div>
          {initial.agent_rating && (
            <div>
              <p className="text-xs text-slate-500 mb-1">تقييم مسؤول المبيعات</p>
              {renderStars(initial.agent_rating)}
            </div>
          )}
          {initial.comment && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 italic">
              &ldquo;{initial.comment}&rdquo;
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400 mb-3">لم يقدم العميل تقييمه بعد</p>
          <div className="flex gap-2 justify-center">
            <button onClick={copyLink}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
              <Send size={12} /> {copied ? 'تم النسخ!' : 'نسخ رابط الاستطلاع'}
            </button>
            <a href={surveyUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
              <ExternalLink size={12} /> معاينة
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
