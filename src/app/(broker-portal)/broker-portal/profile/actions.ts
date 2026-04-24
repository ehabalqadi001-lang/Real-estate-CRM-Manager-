'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim() || null
}

async function uploadFile(
  service: ReturnType<typeof createServiceRoleClient>,
  file: File,
  path: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null
  const { data, error } = await service.storage
    .from('documents')
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: true })
  if (error) {
    console.error('Upload error', path, error.message)
    return null
  }
  return data.path
}

export async function updateBrokerProfile(formData: FormData) {
  const session = await requireSession()
  const service = createServiceRoleClient()
  const uid = session.user.id

  const photoFile = formData.get('photo') as File | null
  const nationalIdFile = formData.get('nationalIdFile') as File | null
  const taxCardFile = formData.get('taxCardFile') as File | null

  const [photoPath, nationalIdPath, taxCardPath] = await Promise.all([
    photoFile instanceof File
      ? uploadFile(service, photoFile, `broker-photos/${uid}/profile.${photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'}`)
      : Promise.resolve(null),
    nationalIdFile instanceof File
      ? uploadFile(service, nationalIdFile, `broker-docs/${uid}/national_id.${nationalIdFile.name.split('.').pop()?.toLowerCase() || 'jpg'}`)
      : Promise.resolve(null),
    taxCardFile instanceof File
      ? uploadFile(service, taxCardFile, `broker-docs/${uid}/tax_card.${taxCardFile.name.split('.').pop()?.toLowerCase() || 'jpg'}`)
      : Promise.resolve(null),
  ])

  const patch: Record<string, unknown> = {
    national_id:          text(formData, 'nationalId'),
    tax_card_number:      text(formData, 'taxCardNumber'),
    bank_name:            text(formData, 'bankName'),
    bank_account_name:    text(formData, 'bankAccountName'),
    bank_account_number:  text(formData, 'bankAccountNumber'),
    bank_iban:            text(formData, 'bankIban'),
  }
  if (photoPath)      patch.photo_url        = photoPath
  if (nationalIdPath) patch.national_id_url  = nationalIdPath
  if (taxCardPath)    patch.tax_card_url     = taxCardPath

  const { error } = await service
    .from('broker_profiles')
    .update(patch)
    .eq('profile_id', uid)

  if (error) throw new Error(error.message)

  revalidatePath('/broker-portal/profile')
}
