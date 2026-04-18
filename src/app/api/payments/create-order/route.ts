import { NextResponse } from 'next/server'
import { amountToCents, authenticatePaymob, createPaymobOrder } from '@/lib/paymob/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { package_id?: string } | null
  if (!body?.package_id) return NextResponse.json({ error: 'Missing package_id' }, { status: 400 })

  const { data: pointPackage, error } = await supabase
    .from('point_packages')
    .select('id, amount_egp')
    .eq('id', body.package_id)
    .eq('is_active', true)
    .single()

  if (error || !pointPackage) {
    return NextResponse.json({ error: error?.message ?? 'Package not found' }, { status: 404 })
  }

  try {
    const authToken = await authenticatePaymob()
    const merchantOrderId = `fi_${pointPackage.id}_${user.id}_${Date.now()}`
    const orderId = await createPaymobOrder({
      authToken,
      merchantOrderId,
      amountCents: amountToCents(Number(pointPackage.amount_egp)),
    })

    return NextResponse.json({ authToken, orderId, merchantOrderId })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Paymob order creation failed' }, { status: 502 })
  }
}
