'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Banknote, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { requestCommissionPayout } from '@/app/dashboard/commissions/actions'
import type { CommissionRow } from './commission-types'

export function CommissionRequestSheet({ commission }: { commission: CommissionRow }) {
  const [open, setOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [bankDetails, setBankDetails] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [isPending, startTransition] = useTransition()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" className="gap-1 bg-[var(--fi-emerald)] text-white hover:bg-[var(--fi-emerald)]/90" />}>
        <Banknote className="size-3.5" />
        طلب صرف
      </SheetTrigger>
      <SheetContent side="left" className="bg-white sm:max-w-md" dir="rtl">
        <SheetHeader>
          <SheetTitle className="text-right text-xl font-black text-[var(--fi-ink)]">طلب صرف عمولة</SheetTitle>
          <SheetDescription className="text-right font-semibold">
            {commission.agentName} · {formatMoney(commission.agentAmount)}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <label className="grid gap-1 text-sm font-black">
            طريقة الدفع
            <select className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="cash">نقدي</option>
              <option value="check">شيك</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-black">
            بيانات البنك
            <textarea className="min-h-24 rounded-lg border border-[var(--fi-line)] p-3 text-sm" value={bankDetails} onChange={(event) => setBankDetails(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-black">
            مرجع الدفع
            <Input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-black">
            رابط إيصال اختياري
            <Input value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} placeholder="https://..." />
          </label>
          <Button
            className="h-10 w-full gap-2 bg-[var(--fi-emerald)] text-white hover:bg-[var(--fi-emerald)]/90"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              try {
                await requestCommissionPayout({ commissionId: commission.id, paymentMethod, bankDetails, paymentReference, receiptUrl })
                toast.success('تم إرسال طلب الصرف')
                setOpen(false)
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'تعذر إرسال الطلب')
              }
            })}
          >
            <Send className="size-4" />
            إرسال الطلب
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value)} ج.م`
}
