'use server'

import { revalidatePath } from 'next/cache'
import { getDeveloperOptions } from '@/domains/inventory/queries'
import { createBulkInventoryUnits, createInventoryUnit } from '@/domains/inventory/mutations'

export async function getDevelopersList() {
  return getDeveloperOptions()
}

export async function addSingleUnit(formData: FormData) {
  const result = await createInventoryUnit({
    unit_name: String(formData.get('unit_name') ?? ''),
    developer_id: String(formData.get('developer_id') ?? ''),
    unit_type: String(formData.get('unit_type') ?? ''),
    price: Number.parseFloat(String(formData.get('price') ?? '0')) || 0,
    status: String(formData.get('status') ?? 'available'),
  })

  if (!result.ok) {
    throw new Error(result.error)
  }

  revalidatePath('/dashboard/inventory')
}

export async function addBulkUnits(units: Record<string, unknown>[], developer_id: string) {
  const result = await createBulkInventoryUnits({
    rows: units,
    developer_id,
  })

  if (!result.ok) {
    throw new Error(result.error)
  }

  revalidatePath('/dashboard/inventory')
  return result.data
}
