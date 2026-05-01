'use client'

import { useTransition } from 'react'
import { ArrowRight, FileText } from 'lucide-react'
import { advancePipelineAction, generateOfferLetterAction } from './actions'

const nextStage: Record<string, string> = {
  new: 'screening',
  screening: 'interview_1',
  interview_1: 'interview_2',
  interview_2: 'offer_sent',
  offer_sent: 'hired',
}

const stageLabel: Record<string, string> = {
  new: 'جديد',
  screening: 'فرز أولي',
  interview_1: 'مقابلة 1',
  interview_2: 'مقابلة 2',
  offer_sent: 'عرض مُرسَل',
  hired: 'تم التعيين',
  rejected: 'مرفوض',
}

export function AdvancePipelineButton({ candidateId, currentStage }: { candidateId: string; currentStage: string }) {
  const [pending, startTransition] = useTransition()
  const next = nextStage[currentStage]
  if (!next) return null

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await advancePipelineAction(candidateId, next) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
    >
      <ArrowRight className="size-3.5" />
      {pending ? 'جاري...' : stageLabel[next]}
    </button>
  )
}

export function GenerateOfferButton({ candidateId }: { candidateId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await generateOfferLetterAction(candidateId) })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
    >
      <FileText className="size-3.5" />
      {pending ? 'جاري...' : 'خطاب عرض'}
    </button>
  )
}
