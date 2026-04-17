'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/domains/clients/mutations'

export async function addClient(formData: FormData) {
  const result = await createClient({
    name: String(formData.get('name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
  })

  if (!result.ok) {
    throw new Error(result.error)
  }

  revalidatePath('/dashboard/clients')
}
