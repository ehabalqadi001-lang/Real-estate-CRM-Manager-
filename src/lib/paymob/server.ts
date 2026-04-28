import 'server-only'

import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/service'

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api'
const CARD_IFRAME_BASE_URL = 'https://accept.paymob.com/api/acceptance/iframes'

export type PaymobPaymentMethod = 'card' | 'wallet'

export type PaymobPackage = {
  id: string
  name: string
  amountEgp: number
  pointsAmount: number
}

type PaymobBillingData = {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  apartment: string
  floor: string
  street: string
  building: string
  shipping_method: string
  postal_code: string
  city: string
  country: string
  state: string
}

export type PaymobConfig = {
  apiKey: string
  hmacSecret: string
  cardIntegrationId: number
  walletIntegrationId: number
  cardIframeId: string
  pointsPerEgp: number
}

export function getPaymobConfig() {
  const apiKey = process.env.PAYMOB_API_KEY
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET
  const publicKey = process.env.PAYMOB_PUBLIC_KEY
  const cardIntegrationId = Number(process.env.PAYMOB_CARD_INTEGRATION_ID)
  const walletIntegrationId = Number(process.env.PAYMOB_WALLET_INTEGRATION_ID)

  if (!apiKey || !hmacSecret || !publicKey || !cardIntegrationId || !walletIntegrationId) {
    throw new Error('Missing Paymob live configuration')
  }

  return { apiKey, hmacSecret, publicKey, cardIntegrationId, walletIntegrationId }
}

export async function getPaymobConfigAsync(): Promise<PaymobConfig> {
  const supabase = createServiceRoleClient()
  const [{ data: settings }, { data: costConfig }] = await Promise.all([
    supabase.from('paymob_settings').select('*').eq('id', true).maybeSingle(),
    supabase.from('ad_cost_config').select('points_per_egp').eq('id', true).maybeSingle(),
  ])

  const apiKey = settings?.api_key || process.env.PAYMOB_API_KEY || ''
  const hmacSecret = settings?.hmac_secret || process.env.PAYMOB_HMAC_SECRET || ''
  const cardIntegrationId = settings?.card_integration_id
    ? Number(settings.card_integration_id)
    : Number(process.env.PAYMOB_CARD_INTEGRATION_ID ?? 0)
  const walletIntegrationId = settings?.wallet_integration_id
    ? Number(settings.wallet_integration_id)
    : Number(process.env.PAYMOB_WALLET_INTEGRATION_ID ?? 0)
  const cardIframeId = settings?.card_iframe_id
    || process.env.PAYMOB_CARD_IFRAME_ID
    || String(cardIntegrationId)

  if (!apiKey || !hmacSecret || !cardIntegrationId || !walletIntegrationId) {
    throw new Error('Missing Paymob live configuration. Set credentials in Admin > Points or environment variables.')
  }

  return {
    apiKey,
    hmacSecret,
    cardIntegrationId,
    walletIntegrationId,
    cardIframeId,
    pointsPerEgp: Number(costConfig?.points_per_egp ?? 10),
  }
}

export function amountToCents(amountEgp: number) {
  return Math.round(amountEgp * 100)
}

export async function authenticatePaymob(config?: Pick<PaymobConfig, 'apiKey'>) {
  const apiKey = config?.apiKey ?? getPaymobConfig().apiKey
  const response = await fetch(`${PAYMOB_BASE_URL}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Paymob authentication failed with ${response.status}`)
  }

  const data = await response.json() as { token?: string }
  if (!data.token) throw new Error('Paymob did not return an auth token')
  return data.token
}

export async function createPaymobOrder({
  authToken,
  merchantOrderId,
  amountCents,
}: {
  authToken: string
  merchantOrderId: string
  amountCents: number
}) {
  const response = await fetch(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: merchantOrderId,
      items: [],
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Paymob order creation failed with ${response.status}`)
  }

  const data = await response.json() as { id?: number }
  if (!data.id) throw new Error('Paymob did not return an order id')
  return data.id
}

export async function createPaymobPaymentKey({
  authToken,
  orderId,
  amountCents,
  integrationId,
  billingData,
  metadata,
}: {
  authToken: string
  orderId: number
  amountCents: number
  integrationId: number
  billingData: PaymobBillingData
  metadata: Record<string, string>
}) {
  const response = await fetch(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency: 'EGP',
      integration_id: integrationId,
      lock_order_when_paid: true,
      extra: metadata,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Paymob payment key creation failed with ${response.status}`)
  }

  const data = await response.json() as { token?: string }
  if (!data.token) throw new Error('Paymob did not return a payment token')
  return data.token
}

export function buildCardCheckoutUrl(paymentToken: string, iframeId: string | number) {
  return `${CARD_IFRAME_BASE_URL}/${iframeId}?payment_token=${encodeURIComponent(paymentToken)}`
}

export async function createPaymobCheckout(input: {
  method: PaymobPaymentMethod
  userId: string
  userEmail: string
  userName: string
  phoneNumber?: string
  pointPackage: PaymobPackage
  config?: PaymobConfig
}) {
  const config = input.config ?? await getPaymobConfigAsync()
  const amountCents = amountToCents(input.pointPackage.amountEgp)
  const merchantOrderId = `fi_${input.pointPackage.id}_${input.userId}_${Date.now()}`
  const authToken = await authenticatePaymob(config)
  const integrationId = input.method === 'wallet' ? config.walletIntegrationId : config.cardIntegrationId
  const orderId = await createPaymobOrder({ authToken, merchantOrderId, amountCents })
  const paymentToken = await createPaymobPaymentKey({
    authToken,
    orderId,
    amountCents,
    integrationId,
    billingData: createBillingData(input.userName, input.userEmail, input.phoneNumber),
    metadata: {
      user_id: input.userId,
      package_id: input.pointPackage.id,
      points_amount: String(input.pointPackage.pointsAmount),
      payment_method: input.method,
    },
  })

  return {
    orderId,
    merchantOrderId,
    paymentToken,
    redirectUrl: input.method === 'card' ? buildCardCheckoutUrl(paymentToken, config.cardIframeId) : null,
  }
}

export async function createCustomTopUpCheckout(input: {
  method: PaymobPaymentMethod
  userId: string
  userEmail: string
  userName: string
  phoneNumber?: string
  pointsAmount: number
  amountEgp: number
  config?: PaymobConfig
}) {
  const config = input.config ?? await getPaymobConfigAsync()
  const amountCents = amountToCents(input.amountEgp)
  const merchantOrderId = `fi_custom_${input.userId}_${input.pointsAmount}_${amountCents}_${Date.now()}`
  const authToken = await authenticatePaymob(config)
  const integrationId = input.method === 'wallet' ? config.walletIntegrationId : config.cardIntegrationId
  const orderId = await createPaymobOrder({ authToken, merchantOrderId, amountCents })
  const paymentToken = await createPaymobPaymentKey({
    authToken,
    orderId,
    amountCents,
    integrationId,
    billingData: createBillingData(input.userName, input.userEmail, input.phoneNumber),
    metadata: {
      user_id: input.userId,
      points_amount: String(input.pointsAmount),
      amount_egp: String(input.amountEgp),
      payment_method: input.method,
      type: 'custom_topup',
    },
  })

  return {
    orderId,
    merchantOrderId,
    paymentToken,
    redirectUrl: input.method === 'card' ? buildCardCheckoutUrl(paymentToken, config.cardIframeId) : null,
  }
}

export function verifyPaymobHmac(payload: Record<string, unknown>, suppliedHmac: string | null, hmacSecretOverride?: string) {
  if (!suppliedHmac) return false
  const hmacSecret = hmacSecretOverride || getPaymobConfig().hmacSecret
  const calculated = crypto
    .createHmac('sha512', hmacSecret)
    .update(buildPaymobHmacMessage(payload))
    .digest('hex')

  const calculatedBuffer = Buffer.from(calculated)
  const suppliedBuffer = Buffer.from(suppliedHmac)
  if (calculatedBuffer.length !== suppliedBuffer.length) return false
  return crypto.timingSafeEqual(calculatedBuffer, suppliedBuffer)
}

function buildPaymobHmacMessage(payload: Record<string, unknown>) {
  const obj = (payload.obj ?? payload) as Record<string, unknown>
  const order = obj.order as Record<string, unknown> | undefined
  const sourceData = obj.source_data as Record<string, unknown> | undefined
  const values = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    order?.id,
    obj.owner,
    obj.pending,
    sourceData?.pan,
    sourceData?.sub_type,
    sourceData?.type,
    obj.success,
  ]

  return values.map((value) => valueToPaymobString(value)).join('')
}

function valueToPaymobString(value: unknown) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function createBillingData(name: string, email: string, phoneNumber = '01101160208'): PaymobBillingData {
  const [firstName, ...rest] = name.trim().split(/\s+/)
  return {
    first_name: firstName || 'FAST',
    last_name: rest.join(' ') || 'INVESTMENT',
    email,
    phone_number: phoneNumber,
    apartment: 'NA',
    floor: 'NA',
    street: 'NA',
    building: 'NA',
    shipping_method: 'NA',
    postal_code: '00000',
    city: 'Cairo',
    country: 'EG',
    state: 'Cairo',
  }
}
