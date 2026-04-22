import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { verifyDeveloperFeedRequest } from '@/lib/integrations/developer-feed-auth'
import { nullableUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

type FeedPayload = {
  integrationId?: string
  developerId?: string
  externalReference?: string
  eventType?: 'unit_created' | 'unit_updated' | 'price_changed' | 'availability_changed' | 'payment_plan_changed'
  property?: {
    title?: string
    titleAr?: string
    sourceType?: 'primary' | 'resale'
    propertyType?: string
    unitType?: string
    city?: string
    district?: string
    areaSqm?: number
    bedrooms?: number
    bathrooms?: number
    listPrice?: number
    downPayment?: number
    monthlyInstallment?: number
    scarcityRemainingUnits?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const payload = JSON.parse(rawBody) as FeedPayload
    const hasSignedHeaders =
      request.headers.has('x-fi-client-key') ||
      request.headers.has('x-fi-timestamp') ||
      request.headers.has('x-fi-signature')
    const authResult = hasSignedHeaders ? await verifyDeveloperFeedRequest(request, rawBody) : null
    if (authResult && !authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const supabase = createServiceRoleClient()
    const signedClient = authResult?.ok ? authResult.client : null
    const integrationId = nullableUuid(payload.integrationId)
    let integration: { id: string; company_id: string | null; developer_id: string | null; active: boolean } | null = null

    if (signedClient) {
      const { data, error: integrationError } = await supabase
        .from('api_integrations')
        .select('id, company_id, developer_id, active')
        .eq('developer_id', signedClient.developer_id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (integrationError) throw integrationError
      integration = data
    } else {
      if (!integrationId) {
        return NextResponse.json({ error: 'integrationId مطلوب وصحيح أو استخدم توقيع HMAC للمطور.' }, { status: 400 })
      }

      const { data, error: integrationError } = await supabase
        .from('api_integrations')
        .select('id, company_id, developer_id, active')
        .eq('id', integrationId)
        .maybeSingle()

      if (integrationError) throw integrationError
      integration = data
    }

    if (!integration || !integration.active) {
      return NextResponse.json({ error: 'التكامل غير موجود أو غير نشط.' }, { status: 404 })
    }

    const eventType = payload.eventType ?? 'unit_updated'
    const { data: event, error: eventError } = await supabase
      .from('inventory_feed_events')
      .insert({
        integration_id: integration.id,
        company_id: integration.company_id,
        developer_id: signedClient?.developer_id ?? nullableUuid(payload.developerId) ?? integration.developer_id,
        external_reference: payload.externalReference ?? null,
        event_type: eventType,
        payload: {
          ...payload,
          auth_mode: signedClient ? 'hmac' : 'legacy_integration_id',
          developer_api_client_id: signedClient?.id ?? null,
        },
        status: 'pending',
      })
      .select('id')
      .single()

    if (eventError) throw eventError

    let propertyId: string | null = null
    if (payload.property) {
      const { data: property, error: propertyError } = await supabase
        .from('marketplace_properties')
        .insert({
          company_id: integration.company_id,
          developer_id: signedClient?.developer_id ?? nullableUuid(payload.developerId) ?? integration.developer_id,
          source_type: payload.property.sourceType ?? 'primary',
          listing_channel: 'developer_feed',
          title: payload.property.title ?? payload.property.titleAr ?? 'وحدة من تكامل مطور',
          title_ar: payload.property.titleAr ?? payload.property.title ?? 'وحدة من تكامل مطور',
          property_type: payload.property.propertyType ?? 'residential',
          unit_type: payload.property.unitType ?? null,
          city: payload.property.city ?? 'القاهرة',
          district: payload.property.district ?? null,
          area_sqm: payload.property.areaSqm ?? null,
          bedrooms: payload.property.bedrooms ?? null,
          bathrooms: payload.property.bathrooms ?? null,
          list_price: payload.property.listPrice ?? 0,
          down_payment: payload.property.downPayment ?? null,
          monthly_installment: payload.property.monthlyInstallment ?? null,
          scarcity_remaining_units: payload.property.scarcityRemainingUnits ?? null,
          verification_status: 'verified',
          listing_status: 'published',
          metadata: { external_reference: payload.externalReference, feed_event_id: event.id },
        })
        .select('id')
        .single()

      if (propertyError) throw propertyError
      propertyId = property.id
    }

    await supabase
      .from('inventory_feed_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', event.id)

    await supabase
      .from('api_integrations')
      .update({ last_status: 'success', last_sync_at: new Date().toISOString() })
      .eq('id', integration.id)

    return NextResponse.json({ success: true, eventId: event.id, propertyId })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر معالجة feed المطور.' }, { status: 500 })
  }
}
