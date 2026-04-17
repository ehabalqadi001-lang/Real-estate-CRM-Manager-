'use client'

import { useTransition } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { approvePayout } from '@/domains/commissions/actions'
import { useRouter } from 'next/navigation'

export default function ApprovePayoutButton({ payoutId }: { payoutId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await approvePayout(payoutId); router.refresh() })}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
    >
      {isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
      اعتماد
    </button>
  )
}
