'use client'

import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'
import { Check, CreditCard, Loader2, ShieldCheck, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createPointCheckoutSession, initialCheckoutActionState } from './actions'

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
  const [state, formAction, pending] = useActionState(createPointCheckoutSession, initialCheckoutActionState)

  const methodLabel = useMemo(
    () => (method === 'card' ? 'Pay by Card' : 'Pay by Mobile Wallet'),
    [method]
  )

  return (
    <form action={formAction} className="flex h-full flex-col rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
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

      <div className="mt-5 rounded-lg bg-[#F3F8F4] p-4">
        <p className="text-3xl font-black text-[#17375E]">{Number(pointPackage.points_amount).toLocaleString()} pts</p>
        <p className="mt-1 text-sm font-bold text-[#64748B]">
          {Number(pointPackage.amount_egp).toLocaleString()} {pointPackage.currency}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-[#F6FAF7] p-1">
        <PaymentMethodButton active={method === 'card'} icon={CreditCard} label="Card" onClick={() => setMethod('card')} />
        <PaymentMethodButton active={method === 'wallet'} icon={Smartphone} label="Wallet" onClick={() => setMethod('wallet')} />
      </div>

      {method === 'wallet' && (
        <div className="mt-4 rounded-lg border border-[#27AE60]/20 bg-[#27AE60]/5 p-3 text-sm font-semibold leading-6 text-[#1E874B]">
          You will receive a Paymob wallet token after submitting. Complete the charge from your Egyptian mobile wallet.
        </div>
      )}

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] p-3 text-sm font-bold leading-6 text-[#334155] transition hover:border-[#27AE60]/50">
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
          I have read and accepted the{' '}
          <Link href="/payment-terms" target="_blank" className="text-[#27AE60] underline underline-offset-4">
            payment terms and conditions
          </Link>
          .
        </span>
      </label>

      <Button
        type="submit"
        disabled={!accepted || pending}
        className="mt-4 h-11 w-full bg-[#27AE60] text-white hover:bg-[#1F8E4F] disabled:cursor-not-allowed"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : method === 'card' ? (
          <CreditCard className="size-4" />
        ) : (
          <Smartphone className="size-4" />
        )}
        {pending ? 'Starting checkout...' : accepted ? methodLabel : 'Accept terms to continue'}
      </Button>

      {state.status === 'error' && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700">
          {state.message}
        </p>
      )}

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
        active ? 'bg-white text-[#27AE60] shadow-sm ring-1 ring-[#27AE60]/20' : 'text-[#64748B] hover:text-[#102033]'
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}
