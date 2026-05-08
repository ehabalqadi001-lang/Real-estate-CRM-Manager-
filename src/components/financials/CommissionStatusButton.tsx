'use client'

import { useState } from 'react'
import { updateCommissionStatus } from '@/app/company/financials/actions'
import { Loader2, DollarSign, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

export default function CommissionStatusButton({ commissionId, currentStatus }: { commissionId: string, currentStatus: string }) {
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async (newStatus: string) => {
    setIsLoading(true)
    try {
      await updateCommissionStatus(commissionId, newStatus)
    } catch (error: unknown) {
      alert(t('تعذر تحديث الحالة: ', 'Could not update status: ') + (error instanceof Error ? error.message : t('خطأ غير معروف', 'Unknown error')))
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStatus === 'paid') {
    return <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">{t('العملية مغلقة', 'Closed')}</span>
  }

  if (currentStatus === 'approved') {
    return (
      <button
        onClick={() => handleUpdate('paid')}
        disabled={isLoading}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm"
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
        {t('تأكيد الصرف النهائي', 'Confirm Payment')}
      </button>
    )
  }

  return (
    <button
      onClick={() => handleUpdate('approved')}
      disabled={isLoading}
      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm"
    >
      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
      {t('اعتماد مالي', 'Approve')}
    </button>
  )
}