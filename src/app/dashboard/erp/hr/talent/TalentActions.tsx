'use client'

import { useTransition } from 'react'
import { ArrowRight, FileText } from 'lucide-react'
import { advancePipelineAction, generateOfferLetterAction } from './actions'
import { useI18n } from '@/hooks/use-i18n'

const nextStage: Record<string, string> = {
  new: 'screening',
  screening: 'interview_1',
  interview_1: 'interview_2',
  interview_2: 'offer_sent',
  offer_sent: 'hired',
}

export function AdvancePipelineButton({ candidateId, currentStage }: { candidateId: string; currentStage: string }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  const next = nextStage[currentStage]
  if (!next) return null

  const stageLabel: Record<string, string> = {
    new: t('جديد', 'New'),
    screening: t('فرز أولي', 'Screening'),
    interview_1: t('مقابلة 1', 'Interview 1'),
    interview_2: t('مقابلة 2', 'Interview 2'),
    offer_sent: t('عرض مُرسَل', 'Offer Sent'),
    hired: t('تم التعيين', 'Hired'),
    rejected: t('مرفوض', 'Rejected'),
  }

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await advancePipelineAction(candidateId, next) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
    >
      <ArrowRight className="size-3.5" />
      {pending ? '...' : stageLabel[next]}
    </button>
  )
}

export function GenerateOfferButton({ candidateId }: { candidateId: string }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await generateOfferLetterAction(candidateId) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
    >
      <FileText className="size-3.5" />
      {pending ? '...' : t('خطاب عرض', 'Offer Letter')}
    </button>
  )
}
