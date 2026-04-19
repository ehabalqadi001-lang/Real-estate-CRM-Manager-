'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import { approvePayoutAction } from './actions'

interface Props {
  payoutId: string
  recipientName: string
  amount: string
}

export function PayoutConfirmDialog({ payoutId, recipientName, amount }: Props) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'pin' | 'done'>('idle')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleApprove = () => {
    if (pin.length < 4) {
      setError('أدخل رمز التحقق المكون من 4 أرقام')
      return
    }
    setError('')
    const fd = new FormData()
    fd.set('payout_id', payoutId)
    fd.set('confirmation_pin', pin)
    startTransition(async () => {
      const result = await approvePayoutAction(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setStep('done')
      }
    })
  }

  if (step === 'idle') {
    return (
      <Button
        size="sm"
        onClick={() => setStep('confirm')}
        className="bg-[#C9964A] font-semibold text-white hover:bg-[#A87A3A]"
      >
        <CheckCircle2 className="size-3.5" />
        إصدار دفعة
      </Button>
    )
  }

  if (step === 'done') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0F8F83]">
        <CheckCircle2 className="size-4" />
        تمت الموافقة
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#DDE6E4] bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-[#C9964A]/10 p-2">
            <ShieldAlert className="size-6 text-[#C9964A]" />
          </div>
          <div>
            <p className="font-black text-[#102033] dark:text-white">
              {step === 'confirm' ? 'تأكيد إصدار الدفعة' : 'رمز التحقق الثنائي'}
            </p>
            <p className="text-xs font-semibold text-slate-500">خطوة {step === 'confirm' ? '1' : '2'} من 2</p>
          </div>
        </div>

        {step === 'confirm' && (
          <>
            <div className="mb-5 rounded-lg bg-[#FBFCFA] p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold text-slate-500">المستلم</p>
              <p className="mt-1 font-black text-[#102033] dark:text-white">{recipientName}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">المبلغ</p>
              <p className="mt-1 text-xl font-black text-[#C9964A]">{amount}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-[#DDE6E4]"
                onClick={() => setStep('idle')}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-[#C9964A] font-semibold text-white hover:bg-[#A87A3A]"
                onClick={() => setStep('pin')}
              >
                متابعة
              </Button>
            </div>
          </>
        )}

        {step === 'pin' && (
          <>
            <p className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              أدخل رمز الموافقة المكون من 4 أرقام الخاص بك لإتمام العملية.
            </p>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="mb-1 text-center text-2xl tracking-[0.5em]"
            />
            {error && <p className="mb-3 text-xs font-semibold text-red-500">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-[#DDE6E4]"
                onClick={() => { setStep('idle'); setPin(''); setError('') }}
              >
                إلغاء
              </Button>
              <Button
                disabled={pending}
                className="flex-1 bg-[#0F8F83] font-semibold text-white hover:bg-[#0B6F66]"
                onClick={handleApprove}
              >
                {pending ? 'جاري التحقق…' : 'تأكيد الإصدار'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
