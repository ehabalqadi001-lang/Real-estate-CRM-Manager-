'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/domains/clients/mutations'
import type { ActionResult } from '@/shared/types/action-result'

export async function addClient(formData: FormData): Promise<ActionResult> {
  const investmentTypes = formData.getAll('investment_types').map(String).filter(Boolean)
  const investmentLocations = formData.getAll('investment_locations').map(String).filter(Boolean)
  const budgetRaw = formData.get('investment_budget')
  const budget = budgetRaw ? Number(String(budgetRaw).replace(/,/g, '')) : null

  const result = await createClient({
    name: String(formData.get('name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    phone_country_code: String(formData.get('phone_country_code') ?? '+20'),
    secondary_phone: String(formData.get('secondary_phone') ?? '') || null,
    secondary_phone_country_code: String(formData.get('secondary_phone_country_code') ?? '+20'),
    email: String(formData.get('email') ?? '') || null,
    nationality: String(formData.get('nationality') ?? '') || null,
    residence_country: String(formData.get('residence_country') ?? '') || null,
    investment_types: investmentTypes,
    investment_budget: budget && !isNaN(budget) ? budget : null,
    payment_method: String(formData.get('payment_method') ?? '') || null,
    investment_locations: investmentLocations,
  })

  if (!result.ok) {
    return result
  }

  revalidatePath('/dashboard/clients')
  return { ok: true, data: undefined }
}
