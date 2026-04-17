'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function updateLeadStatus(leadId: string, formData: FormData) {
  const supabase = await createServerClient()
  const payload: Record<string, unknown> = {}

  const status = formData.get('status')
  const temperature = formData.get('temperature')
  const expectedValue = formData.get('expected_value')
  const notes = formData.get('notes')

  if (status)         payload.status = status
  if (temperature)    payload.temperature = temperature
  if (expectedValue)  payload.expected_value = Number(expectedValue)
  if (notes)          payload.notes = notes

  const { error } = await supabase.from('leads').update(payload).eq('id', leadId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/leads/${leadId}`)
  revalidatePath('/dashboard/leads')
}
