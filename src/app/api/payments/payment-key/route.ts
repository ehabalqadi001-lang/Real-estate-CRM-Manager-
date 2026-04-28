import { NextResponse } from 'next/server'
import {
  amountToCents,
  authenticatePaymob,
  createPaymobPaymentKey,
  getPaymobConfigAsync,
  type PaymobPaymentMethod,
} from '@/lib/paymob/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as {
    package_id?: string
    order_id?: number
    method?: PaymobPaymentMethod
  } | null

  if (!body?.package_id || !body.order_id || !body.method) {
    return NextResponse.json({ error: 'package_id, order_id, and method are required' }, { status: 400 })
  }

  if (!['card', 'wallet'].includes(body.method)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  }

  const [{ data: pointPackage, error }, { data: profile }] = await Promise.all([
    supabase
      .from('point_packages')
      .select('id, amount_egp, points_amount')
      .eq('id', body.package_id)
      .eq('is_active', true)
      .single(),
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
  ])

  if (error || !pointPackage) {
    return NextResponse.json({ error: error?.message ?? 'Package not found' }, { status: 404 })
  }

  try {
    const config = await getPaymobConfigAsync()
    const authToken = await authenticatePaymob(config)
    const integrationId = body.method === 'wallet' ? config.walletIntegrationId : config.cardIntegrationId
    const paymentToken = await createPaymobPaymentKey({
      authToken,
      orderId: body.order_id,
      amountCents: amountToCents(Number(pointPackage.amount_egp)),
      integrationId,
      billingData: {
        first_name: profile?.full_name?.split(' ')[0] || 'FAST',
        last_name: profile?.full_name?.split(' ').slice(1).join(' ') || 'INVESTMENT',
        email: user.email ?? 'payments@fastinvestment.com',
        phone_number: profile?.phone || '01101160208',
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: '00000',
        city: 'Cairo',
        country: 'EG',
        state: 'Cairo',
      },
      metadata: {
        user_id: user.id,
        package_id: pointPackage.id,
        points_amount: String(pointPackage.points_amount),
        payment_method: body.method,
      },
    })

    return NextResponse.json({ paymentToken })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Paymob payment key failed' }, { status: 502 })
  }
}
