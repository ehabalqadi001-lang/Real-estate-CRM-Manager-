'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import type { ActionResult } from '@/shared/types/action-result'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim() || null
}

export async function updateBrokerProfile(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const service = createServiceRoleClient()
    const uid = session.user.id

    // File URLs are uploaded client-side and passed as hidden fields (full public URLs)
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

    if (error) {
      return { ok: false, error: error.message }
    }

    if (photoPath) {
      await service.from('profiles').update({ avatar_url: photoPath }).eq('id', uid)
      await service.from('user_profiles').update({ avatar_url: photoPath }).eq('id', uid)
    }

    revalidatePath('/broker-portal/profile')
    return { ok: true, data: undefined }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع',
    }
  }
}
