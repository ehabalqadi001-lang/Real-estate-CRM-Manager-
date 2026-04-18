import { NextResponse } from 'next/server'
import { verifyPaymobHmac } from '@/lib/paymob/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const url = new URL(request.url)
  const suppliedHmac = url.searchParams.get('hmac')
  const payload = await request.json().catch(() => null) as PaymobWebhookPayload | null

  if (!payload || !verifyPaymobHmac(payload as Record<string, unknown>, suppliedHmac)) {
    return NextResponse.json({ error: 'Invalid Paymob signature' }, { status: 401 })
  }

  const transaction = payload.obj ?? payload
  if (!transaction.success || transaction.pending || transaction.error_occured) {
    return NextResponse.json({ received: true, credited: false })
  }

  const merchantOrderId = transaction.order?.merchant_order_id
  const transactionId = String(transaction.id ?? '')
  if (!merchantOrderId || !transactionId) {
    return NextResponse.json({ error: 'Missing Paymob order metadata' }, { status: 400 })
  }

  const parsed = parseMerchantOrderId(merchantOrderId)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid merchant order id' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data: pointPackage, error: packageError } = await supabase
    .from('point_packages')
    .select('id, name, points_amount, amount_egp, currency')
    .eq('id', parsed.packageId)
    .eq('is_active', true)
    .single()

  if (packageError || !pointPackage) {
    return NextResponse.json({ error: packageError?.message ?? 'Point package not found' }, { status: 404 })
  }

  const { error } = await supabase.rpc('credit_wallet_points', {
    p_user_id: parsed.userId,
    p_package_id: pointPackage.id,
    p_points: Number(pointPackage.points_amount),
    p_type: 'paymob_topup',
    p_money_amount: Number(pointPackage.amount_egp),
    p_currency: pointPackage.currency ?? 'EGP',
    p_paymob_transaction_id: transactionId,
    p_paymob_order_id: String(transaction.order?.id ?? ''),
    p_paymob_integration_id: String(transaction.integration_id ?? ''),
    p_reason: `Paymob top-up for ${pointPackage.name}`,
    p_metadata: {
      paymob_amount_cents: transaction.amount_cents,
      paymob_merchant_order_id: merchantOrderId,
      paymob_source_type: transaction.source_data?.type ?? null,
      paymob_source_sub_type: transaction.source_data?.sub_type ?? null,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ received: true, credited: true })
}

function parseMerchantOrderId(value: string) {
  const parts = value.split('_')
  if (parts.length < 4 || parts[0] !== 'fi') return null
  return {
    packageId: parts[1],
    userId: parts[2],
  }
}

type PaymobWebhookPayload = {
  obj?: PaymobTransaction
} & Partial<PaymobTransaction>

type PaymobTransaction = {
  id?: number | string
  amount_cents?: number | string
  currency?: string
  created_at?: string
  error_occured?: boolean
  has_parent_transaction?: boolean
  integration_id?: number | string
  is_3d_secure?: boolean
  is_auth?: boolean
  is_capture?: boolean
  is_refunded?: boolean
  is_standalone_payment?: boolean
  is_voided?: boolean
  owner?: number | string
  pending?: boolean
  success?: boolean
  order?: {
    id?: number | string
    merchant_order_id?: string
  }
  source_data?: {
    pan?: string
    sub_type?: string
    type?: string
  }
}
