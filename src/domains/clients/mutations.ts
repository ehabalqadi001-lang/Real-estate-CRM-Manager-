import 'server-only'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { ActionResult } from '@/shared/types/action-result'
import type { CreateClientInput } from './types'

function clean(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function createClient(input: CreateClientInput): Promise<ActionResult> {
  const session = await requirePermission('client.create')
  const supabase = await createServerSupabaseClient()

  const name = input.name.trim()
  const phone = input.phone.trim()

  if (!name || !phone) {
    return { ok: false, error: 'اسم العميل ورقم الهاتف مطلوبان', code: 'VALIDATION_ERROR' }
  }

  const { error } = await supabase.from('clients').insert([{
    name,
    full_name: name,
    phone,
    phone_country_code: input.phone_country_code ?? '+20',
    secondary_phone: clean(input.secondary_phone),
    secondary_phone_country_code: input.secondary_phone_country_code ?? '+20',
    email: clean(input.email),
    nationality: clean(input.nationality),
    residence_country: clean(input.residence_country),
    investment_types: input.investment_types?.length ? input.investment_types : [],
    investment_budget: input.investment_budget ?? null,
    payment_method: clean(input.payment_method),
    investment_locations: input.investment_locations?.length ? input.investment_locations : [],
    status: 'active',
    company_id: session.profile.company_id,
    assigned_to: session.user.id,
    user_id: session.user.id,
  }])

  if (error) {
    return { ok: false, error: error.message, code: 'DATABASE_ERROR' }
  }

  return { ok: true, data: undefined }
}
