import 'server-only'

import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerSupabaseClient } from '@/shared/supabase/server'
import type { ActionResult } from '@/shared/types/action-result'
import type { CreateClientInput } from './types'

function cleanOptional(value: string | null | undefined) {
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

  const { error } = await supabase
    .from('clients')
    .insert([{
      name,
      full_name: name,
      phone,
      email: cleanOptional(input.email),
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
