'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'
import { setApprovalPinAction } from './actions'

export function SetApprovalPinForm() {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pending, start] = useTransition()

  const handleSet = () => {
    if (!pin || !confirmPin) return
    setResult(null)
    const fd = new FormData()
    fd.set('pin', pin)
    fd.set('confirm_pin', confirmPin)
    start(async () => {
      const res = await setApprovalPinAction(fd)
      if (res?.error) {
        setResult({ ok: false, msg: res.error })
      } else {
        setResult({ ok: true, msg: 'تم حفظ رمز الموافقة بنجاح' })
        setPin('')
        setConfirmPin('')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-[var(--fi-soft)] p-2">
          <KeyRound className="size-5 text-[var(--fi-emerald)]" />
        </div>
        <div>
          <p className="font-black text-[var(--fi-ink)]">رمز موافقة الدفعات</p>
          <p className="text-xs font-semibold text-[var(--fi-muted)]">رمز مكون من 4-6 أرقام يُطلب عند إصدار كل دفعة</p>
        </div>
      </div>
      <div className="space-y-3">
        <Input
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="الرمز الجديد (4-6 أرقام)"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="text-center tracking-[0.4em]"
        />
        <Input
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="تأكيد الرمز"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
          className="text-center tracking-[0.4em]"
        />
        {result && (
          <p className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-[var(--fi-emerald)]' : 'text-red-600'}`}>
            {result.ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
            {result.msg}
          </p>
        )}
        <Button
          disabled={pending || pin.length < 4 || confirmPin.length < 4}
          onClick={handleSet}
          className="fi-primary-button w-full font-semibold text-white"
        >
          {pending ? 'جاري الحفظ…' : 'حفظ الرمز'}
        </Button>
      </div>
    </div>
  )
}
