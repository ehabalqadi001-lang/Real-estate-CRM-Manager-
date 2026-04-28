'use server'

import { redirect, unstable_rethrow } from 'next/navigation'
import { createPaymobCheckout, createCustomTopUpCheckout, getPaymobConfigAsync, type PaymobPaymentMethod } from '@/lib/paymob/server'
import { createServerClient } from '@/lib/supabase/server'

export type CheckoutActionState = {
  status: 'idle' | 'error'
  message: string
}

export const initialCheckoutActionState: CheckoutActionState = {
  status: 'idle',
  message: '',
}

export async function createPointCheckoutSession(_: CheckoutActionState, formData: FormData): Promise<CheckoutActionState> {
  const packageId = String(formData.get('package_id') ?? '')
  const method = String(formData.get('payment_method') ?? 'card') as PaymobPaymentMethod
  const acceptedTerms = formData.get('accepted_terms') === 'on'

  if (!packageId) return { status: 'error', message: 'The selected package is missing.' }
  if (!acceptedTerms) return { status: 'error', message: 'You must accept the payment terms before checkout.' }
  if (!['card', 'wallet'].includes(method)) return { status: 'error', message: 'Invalid payment method.' }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: pointPackage, error }, { data: profile }] = await Promise.all([
      supabase
        .from('point_packages')
        .select('id, name, amount_egp, points_amount')
        .eq('id', packageId)
        .eq('is_active', true)
        .single(),
      supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
    ])

    if (error || !pointPackage) {
      return { status: 'error', message: error?.message ?? 'This points package is not available right now.' }
    }

    const checkout = await createPaymobCheckout({
      method,
      userId: user.id,
      userEmail: user.email ?? 'payments@fastinvestment.com',
      userName: profile?.full_name ?? user.email ?? 'FAST INVESTMENT',
      phoneNumber: profile?.phone ?? undefined,
      pointPackage: {
        id: pointPackage.id,
        name: pointPackage.name,
        amountEgp: Number(pointPackage.amount_egp),
        pointsAmount: Number(pointPackage.points_amount),
      },
    })

    if (method === 'wallet') {
      redirect(`/marketplace/buy-points?wallet=1&order=${checkout.orderId}&token=${encodeURIComponent(checkout.paymentToken)}`)
    }

    if (!checkout.redirectUrl) {
      return { status: 'error', message: 'Paymob did not return a hosted checkout URL.' }
    }
    redirect(checkout.redirectUrl)
  } catch (error) {
    unstable_rethrow(error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to start checkout right now.',
    }
  }
}

export async function createCustomTopUpSession(_: CheckoutActionState, formData: FormData): Promise<CheckoutActionState> {
  const pointsAmount = Number(formData.get('points_amount') ?? 0)
  const amountEgp = Number(formData.get('amount_egp') ?? 0)
  const method = String(formData.get('payment_method') ?? 'card') as PaymobPaymentMethod
  const acceptedTerms = formData.get('accepted_terms') === 'on'

  if (!acceptedTerms) return { status: 'error', message: 'You must accept the payment terms before checkout.' }
  if (!['card', 'wallet'].includes(method)) return { status: 'error', message: 'Invalid payment method.' }
  if (!Number.isFinite(pointsAmount) || pointsAmount < 10) return { status: 'error', message: 'Minimum 10 points are required.' }
  if (!Number.isFinite(amountEgp) || amountEgp <= 0) return { status: 'error', message: 'Invalid amount.' }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: profile }, config] = await Promise.all([
      supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
      getPaymobConfigAsync(),
    ])

    const checkout = await createCustomTopUpCheckout({
      method,
      userId: user.id,
      userEmail: user.email ?? 'payments@fastinvestment.com',
      userName: profile?.full_name ?? user.email ?? 'FAST INVESTMENT',
      phoneNumber: profile?.phone ?? undefined,
      pointsAmount,
      amountEgp,
      config,
    })

    if (method === 'wallet') {
      redirect(`/marketplace/buy-points?wallet=1&order=${checkout.orderId}&token=${encodeURIComponent(checkout.paymentToken)}`)
    }

    if (!checkout.redirectUrl) {
      return { status: 'error', message: 'Paymob did not return a hosted checkout URL.' }
    }
    redirect(checkout.redirectUrl)
  } catch (error) {
    unstable_rethrow(error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to start custom top-up right now.',
    }
  }
}
