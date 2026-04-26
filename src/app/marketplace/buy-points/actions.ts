'use server'

import { redirect } from 'next/navigation'
import { createPaymobCheckout, createCustomTopUpCheckout, getPaymobConfigAsync, type PaymobPaymentMethod } from '@/lib/paymob/server'
import { createServerClient } from '@/lib/supabase/server'

export async function createPointCheckoutSession(formData: FormData) {
  const packageId = String(formData.get('package_id') ?? '')
  const method = String(formData.get('payment_method') ?? 'card') as PaymobPaymentMethod
  const acceptedTerms = formData.get('accepted_terms') === 'on'

  if (!packageId) throw new Error('Missing points package')
  if (!acceptedTerms) throw new Error('Payment terms must be accepted before checkout')
  if (!['card', 'wallet'].includes(method)) throw new Error('Invalid Paymob payment method')

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
    throw new Error(error?.message ?? 'This points package is not available')
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

  if (!checkout.redirectUrl) throw new Error('Paymob did not return a hosted checkout URL')
  redirect(checkout.redirectUrl)
}

export async function createCustomTopUpSession(formData: FormData) {
  const pointsAmount = Number(formData.get('points_amount') ?? 0)
  const amountEgp = Number(formData.get('amount_egp') ?? 0)
  const method = String(formData.get('payment_method') ?? 'card') as PaymobPaymentMethod
  const acceptedTerms = formData.get('accepted_terms') === 'on'

  if (!acceptedTerms) throw new Error('Payment terms must be accepted before checkout')
  if (!['card', 'wallet'].includes(method)) throw new Error('Invalid payment method')
  if (!Number.isFinite(pointsAmount) || pointsAmount < 10) throw new Error('Minimum 10 points required')
  if (!Number.isFinite(amountEgp) || amountEgp <= 0) throw new Error('Invalid amount')

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

  if (!checkout.redirectUrl) throw new Error('Paymob did not return a hosted checkout URL')
  redirect(checkout.redirectUrl)
}
