'use client'

import { useState } from 'react'
import { updateCommissionStatus } from '@/app/company/financials/actions'
import { Check, Loader2, DollarSign, ShieldCheck } from 'lucide-react'

export default function CommissionStatusButton({ commissionId, currentStatus }: { commissionId: string, currentStatus: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async (newStatus: string) => {
    setIsLoading(true)
    try {
      await updateCommissionStatus(commissionId, newStatus)
    } catch (error: any) {
      alert("تعذر تحديث الحالة: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // إذا تم الصرف، يتم إغلاق الإجراءات
  if (currentStatus === 'paid') {
    return <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">العملية مغلقة</span>
  }

  // إذا كانت معتمدة، ننتظر تأكيد الصرف
  if (currentStatus === 'approved') {
    return (
      <button 
        onClick={() => handleUpdate('paid')}
        disabled={isLoading}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm"
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />} 
        تأكيد الصرف النهائي
      </button>
    )
  }

  // الحالة الافتراضية (قيد المراجعة)
  return (
    <button 
      onClick={() => handleUpdate('approved')}
      disabled={isLoading}
      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm"
    >
      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} 
      اعتماد مالي
    </button>
  )
}