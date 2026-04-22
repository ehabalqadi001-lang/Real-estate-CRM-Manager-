'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import { requireSession } from '@/shared/auth/session'
import { nullableUuid } from '@/lib/uuid'

export type IntegrationActionState = { ok: boolean; message: string }

const MANAGER_ROLES = new Set([
  'super_admin',
  'platform_admin',
  'company_owner',
  'company_admin',
  'data_manager',
  'inventory_rep',
  'developer_relations_manager',
  'admin',
  'company',
])

const INTEGRATION_TYPES = new Set(['inventory', 'prices', 'payment_plans', 'availability', 'leads', 'webhook'])

export async function createIntegrationAction(_prev: IntegrationActionState, formData: FormData): Promise<IntegrationActionState> {
  try {
    const session = await requireSession()
    if (!MANAGER_ROLES.has(session.profile.role)) {
      return { ok: false, message: 'غير مصرح لك بإدارة تكاملات المطورين.' }
    }

    const companyId = nullableUuid(session.profile.company_id) ?? nullableUuid(session.profile.tenant_id)
    const name = String(formData.get('name') ?? '').trim()
    const provider = String(formData.get('provider') ?? '').trim()
    const developerId = nullableUuid(formData.get('developerId'))
    const requestedType = String(formData.get('integrationType') ?? 'inventory')
    const integrationType = INTEGRATION_TYPES.has(requestedType) ? requestedType : 'inventory'
    const baseUrl = String(formData.get('baseUrl') ?? '').trim()
    const syncFrequencyMinutes = Number(formData.get('syncFrequencyMinutes') ?? 60)

    if (!name || !provider) return { ok: false, message: 'اكتب اسم التكامل واسم المزود.' }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('api_integrations').insert({
      company_id: companyId,
      developer_id: developerId,
      name,
      provider,
      integration_type: integrationType,
      base_url: baseUrl || null,
      auth_type: 'api_key',
      sync_frequency_minutes: Number.isFinite(syncFrequencyMinutes) && syncFrequencyMinutes >= 5 ? syncFrequencyMinutes : 60,
      last_status: 'pending',
      active: true,
    })

    if (error) throw error

    revalidatePath('/dashboard/integrations')
    return { ok: true, message: 'تم إنشاء تكامل المطور بنجاح.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'تعذر إنشاء التكامل.' }
  }
}
