'use client'

import { useState } from 'react'
import { Star, Send, ExternalLink } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface Score {
  score: number
  agent_rating?: number
  comment?: string
}

export default function SatisfactionScore({ dealId, initial }: { dealId: string; initial: Score | null }) {
  const { t } = useI18n()
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
        <Star size={15} className="text-yellow-500" /> {t('تقييم رضا العميل', 'Client Satisfaction')}
      </h3>

      {initial ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">{t('التقييم العام', 'Overall Rating')}</p>
            {renderStars(initial.score)}
          </div>
          {initial.agent_rating && (
            <div>
              <p className="text-xs text-slate-500 mb-1">{t('تقييم مسؤول المبيعات', 'Sales Agent Rating')}</p>
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
          <p className="text-xs text-slate-400 mb-3">{t('لم يقدم العميل تقييمه بعد', 'Client has not submitted a rating yet')}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={copyLink}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
              <Send size={12} /> {copied ? t('تم النسخ!', 'Copied!') : t('نسخ رابط الاستطلاع', 'Copy Survey Link')}
            </button>
            <a href={surveyUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
              <ExternalLink size={12} /> {t('معاينة', 'Preview')}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
