'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim() || null
}

export async function updateBrokerProfile(formData: FormData) {
  const session = await requireSession()
  const service = createServiceRoleClient()
  const uid = session.user.id

  // File paths are uploaded client-side and passed as hidden fields
  const photoPath      = text(formData, 'photoPath')
  const nationalIdPath = text(formData, 'nationalIdPath')
  const taxCardPath    = text(formData, 'taxCardPath')

  const patch: Record<string, unknown> = {
    national_id:         text(formData, 'nationalId'),
    tax_card_number:     text(formData, 'taxCardNumber'),
    bank_name:           text(formData, 'bankName'),
    bank_account_name:   text(formData, 'bankAccountName'),
    bank_account_number: text(formData, 'bankAccountNumber'),
    bank_iban:           text(formData, 'bankIban'),
  }
  if (photoPath)      patch.photo_url       = photoPath
  if (nationalIdPath) patch.national_id_url = nationalIdPath
  if (taxCardPath)    patch.tax_card_url    = taxCardPath

  const { error } = await service
    .from('broker_profiles')
    .update(patch)
    .eq('profile_id', uid)

  if (error) throw new Error(error.message)

  revalidatePath('/broker-portal/profile')
}
