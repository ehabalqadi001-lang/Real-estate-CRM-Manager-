'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, CreditCard, Smartphone, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createPointCheckoutSession } from './actions'

type PointPackage = {
  id: string
  name: string
  description: string | null
  package_kind: string
  amount_egp: number
  currency: string
  points_amount: number
}

export function TopUpCheckout({ pointPackage }: { pointPackage: PointPackage }) {
  const [accepted, setAccepted] = useState(false)
  const [method, setMethod] = useState<'card' | 'wallet'>('card')

  const methodLabel = useMemo(() => method === 'card' ? 'Pay by Card' : 'Pay by Mobile Wallet', [method])

  return (
    <form action={createPointCheckoutSession} className="nextora-card flex h-full flex-col rounded-lg p-5">
      <input type="hidden" name="package_id" value={pointPackage.id} />
      <input type="hidden" name="payment_method" value={method} />
      <input type="hidden" name="accepted_terms" value={accepted ? 'on' : ''} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black">{pointPackage.name}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">{pointPackage.description}</p>
        </div>
        <span className="rounded-full bg-[#27AE60]/10 px-2.5 py-1 text-xs font-black text-[#27AE60]">
          {pointPackage.package_kind === 'subscription' ? 'Monthly' : 'One-time'}
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-[#2D2D2D] bg-[#111111] p-4">
        <p className="text-3xl font-black text-[#17375E]">{Number(pointPackage.points_amount).toLocaleString()} pts</p>
        <p className="mt-1 text-sm font-bold text-[#64748B]">
          {Number(pointPackage.amount_egp).toLocaleString()} {pointPackage.currency}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-[#111111] p-1">
        <PaymentMethodButton active={method === 'card'} icon={CreditCard} label="Card" onClick={() => setMethod('card')} />
        <PaymentMethodButton active={method === 'wallet'} icon={Smartphone} label="Wallet" onClick={() => setMethod('wallet')} />
      </div>

      {method === 'wallet' && (
        <div className="mt-4 rounded-lg border border-[#27AE60]/20 bg-[#27AE60]/5 p-3 text-sm font-semibold leading-6 text-[#1E874B]">
          You will receive a Paymob wallet payment token after submitting. Complete the charge from your Egyptian mobile wallet.
        </div>
      )}

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-[#2D2D2D] bg-[#111111] p-3 text-sm font-bold leading-6 text-[#A1A1AA] transition hover:border-[#8AB4FF]/50">
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
          onChange={(event) => setAccepted(event.target.checked)}
          className="sr-only"
          aria-label="Accept payment terms"
        />
        <span>
          لقد قرأت ووافقت على{' '}
          <Link href="/payment-terms" target="_blank" className="text-[#27AE60] underline underline-offset-4">
            شروط وأحكام الدفع
          </Link>
        </span>
      </label>

      <Button
        type="submit"
        disabled={!accepted}
        className="nextora-button mt-4 h-11 w-full disabled:cursor-not-allowed"
      >
        {method === 'card' ? <CreditCard className="size-4" /> : <Smartphone className="size-4" />}
        {accepted ? methodLabel : 'Accept terms to continue'}
      </Button>

      <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[#64748B]">
        <ShieldCheck className="size-4 text-[#27AE60]" />
        FAST INVESTMENT never stores card data. Payments are processed securely by Paymob.
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
        active ? 'bg-white text-[#0D0D0D] shadow-sm ring-1 ring-white/20' : 'text-[#A1A1AA] hover:text-white'
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}
