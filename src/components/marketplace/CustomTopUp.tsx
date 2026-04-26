'use client'

import { useMemo, useState } from 'react'
import { Check, CreditCard, Smartphone, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createCustomTopUpSession } from '@/app/marketplace/buy-points/actions'

export function CustomTopUp({ pointsPerEgp }: { pointsPerEgp: number }) {
  const [desiredPoints, setDesiredPoints] = useState(100)
  const [accepted, setAccepted] = useState(false)
  const [method, setMethod] = useState<'card' | 'wallet'>('card')

  const rate = pointsPerEgp > 0 ? pointsPerEgp : 10
  const amountEgp = useMemo(() => Math.ceil((desiredPoints / rate) * 100) / 100, [desiredPoints, rate])

  const isValid = desiredPoints >= 10 && Number.isFinite(amountEgp) && amountEgp > 0

  return (
    <form action={createCustomTopUpSession} className="flex h-full flex-col rounded-xl border-2 border-[#17375E]/20 bg-gradient-to-br from-white to-[#F3F8F4] p-5 shadow-sm">
      <input type="hidden" name="points_amount" value={String(desiredPoints)} />
      <input type="hidden" name="amount_egp" value={String(amountEgp)} />
      <input type="hidden" name="payment_method" value={method} />
      <input type="hidden" name="accepted_terms" value={accepted ? 'on' : ''} />

      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#17375E] text-white">
          <Zap className="size-4" />
        </span>
        <div>
          <p className="font-black text-[#102033]">شحن مخصص</p>
          <p className="text-xs font-semibold text-[#64748B]">اختر كمية النقاط التي تريدها</p>
        </div>
      </div>

      {/* Points input */}
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-black text-[#64748B]">عدد النقاط المطلوبة</label>
        <input
          type="number"
          min="10"
          step="10"
          value={desiredPoints}
          onChange={(e) => setDesiredPoints(Math.max(10, Number(e.target.value) || 10))}
          className="h-12 w-full rounded-xl border-2 border-[#DDE6E4] bg-white px-4 text-center text-2xl font-black text-[#17375E] outline-none focus:border-[#17375E]/40 focus:ring-2 focus:ring-[#17375E]/10"
          aria-label="عدد النقاط المطلوبة"
        />
      </div>

      {/* Quick amounts */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[50, 100, 200, 500].map((pts) => (
          <button
            key={pts}
            type="button"
            onClick={() => setDesiredPoints(pts)}
            className={cn(
              'rounded-lg py-2 text-xs font-black transition',
              desiredPoints === pts
                ? 'bg-[#17375E] text-white'
                : 'bg-[#EEF6F5] text-[#17375E] hover:bg-[#17375E]/10'
            )}
          >
            {pts}
          </button>
        ))}
      </div>

      {/* Price display */}
      <div className="mt-4 rounded-xl bg-[#17375E] p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold opacity-80">ستدفع</span>
          <span className="text-sm font-bold opacity-80">معدل التحويل</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-3xl font-black">{amountEgp.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م</span>
          <span className="text-sm font-black opacity-70">{rate} نقطة / ج.م</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-[#F6FAF7] p-1">
        <PaymentMethodButton active={method === 'card'} icon={CreditCard} label="بطاقة" onClick={() => setMethod('card')} />
        <PaymentMethodButton active={method === 'wallet'} icon={Smartphone} label="محفظة" onClick={() => setMethod('wallet')} />
      </div>

      {method === 'wallet' && (
        <p className="mt-3 rounded-lg border border-[#27AE60]/20 bg-[#27AE60]/5 px-3 py-2 text-xs font-semibold leading-5 text-[#1E874B]">
          ستحصل على رمز دفع Paymob لإتمام الشحن من محفظتك المحمولة.
        </p>
      )}

      {/* Terms */}
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] p-3 text-sm font-bold leading-6 text-[#334155] transition hover:border-[#27AE60]/50">
        <span
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition',
            accepted ? 'border-[#27AE60] bg-[#27AE60] text-white' : 'border-[#A7B7B2] bg-white text-transparent'
          )}
        >
          <Check className="size-3.5" />
        </span>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="sr-only"
          aria-label="قبول شروط الدفع"
        />
        <span className="text-xs">
          أوافق على{' '}
          <Link href="/payment-terms" target="_blank" className="text-[#27AE60] underline underline-offset-4">
            شروط وأحكام الدفع
          </Link>
        </span>
      </label>

      <Button
        type="submit"
        disabled={!accepted || !isValid}
        className="mt-4 h-11 w-full bg-[#17375E] text-white hover:bg-[#102033] disabled:cursor-not-allowed"
      >
        {method === 'card' ? <CreditCard className="size-4" /> : <Smartphone className="size-4" />}
        {accepted ? `ادفع ${amountEgp.toFixed(2)} ج.م` : 'وافق على الشروط للمتابعة'}
      </Button>

      <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[#64748B]">
        <ShieldCheck className="size-4 text-[#27AE60]" />
        المدفوعات تتم عبر بوابة Paymob الآمنة
      </p>
    </form>
  )
}

function PaymentMethodButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof CreditCard
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-10 items-center justify-center gap-2 rounded-md text-sm font-black transition',
        active ? 'bg-white text-[#17375E] shadow-sm ring-1 ring-[#17375E]/20' : 'text-[#64748B] hover:text-[#102033]'
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}
