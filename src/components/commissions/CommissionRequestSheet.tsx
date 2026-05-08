'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Banknote, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { requestCommissionPayout } from '@/app/dashboard/commissions/actions'
import type { CommissionRow } from './commission-types'
import { useI18n } from '@/hooks/use-i18n'

export function CommissionRequestSheet({ commission }: { commission: CommissionRow }) {
  const { t, numLocale } = useI18n()
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
        {t('طلب صرف', 'Request Payout')}
      </SheetTrigger>
      <SheetContent side="left" className="bg-white sm:max-w-md" dir="rtl">
        <SheetHeader>
          <SheetTitle className="text-right text-xl font-black text-[var(--fi-ink)]">{t('طلب صرف عمولة', 'Commission Payout Request')}</SheetTitle>
          <SheetDescription className="text-right font-semibold">
            {commission.agentName} · {formatMoney(commission.agentAmount, numLocale)}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <label className="grid gap-1 text-sm font-black">
            {t('طريقة الدفع', 'Payment Method')}
            <select className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="bank_transfer">{t('تحويل بنكي', 'Bank Transfer')}</option>
              <option value="cash">{t('نقدي', 'Cash')}</option>
              <option value="check">{t('شيك', 'Check')}</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-black">
            {t('بيانات البنك', 'Bank Details')}
            <textarea className="min-h-24 rounded-lg border border-[var(--fi-line)] p-3 text-sm" value={bankDetails} onChange={(event) => setBankDetails(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-black">
            {t('مرجع الدفع', 'Payment Reference')}
            <Input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-black">
            {t('رابط إيصال اختياري', 'Receipt URL (optional)')}
            <Input value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} placeholder="https://..." />
          </label>
          <Button
            className="h-10 w-full gap-2 bg-[var(--fi-emerald)] text-white hover:bg-[var(--fi-emerald)]/90"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              try {
                await requestCommissionPayout({ commissionId: commission.id, paymentMethod, bankDetails, paymentReference, receiptUrl })
                toast.success(t('تم إرسال طلب الصرف', 'Payout request sent'))
                setOpen(false)
              } catch (error) {
                toast.error(error instanceof Error ? error.message : t('تعذر إرسال الطلب', 'Could not send request'))
              }
            })}
          >
            <Send className="size-4" />
            {t('إرسال الطلب', 'Submit Request')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function formatMoney(value: number, numLocale: string) {
  return `${new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(value)} ${numLocale.startsWith('ar') ? 'ج.م' : 'EGP'}`
}
