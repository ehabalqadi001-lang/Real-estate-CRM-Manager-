'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function createReservation(
  unitId: string,
  clientName: string,
  clientPhone: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'غير مخوّل' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
  const companyId = profile?.company_id ?? user.id

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  // Cancel any existing active reservation for this unit
  await supabase
    .from('unit_reservations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('unit_id', unitId)
    .eq('status', 'active')

  // Create new reservation record (ignore FK error — unitId may be from 'units' not 'inventory')
  const { error: resErr } = await supabase.from('unit_reservations').insert({
    unit_id:      unitId,
    company_id:   companyId,
    reserved_by:  user.id,
    client_name:  clientName,
    client_phone: clientPhone,
    expires_at:   expiresAt,
    status:       'active',
  })

  // Fallback: update the units table directly even if reservation table FK fails
  if (resErr) {
    const { error: unitErr } = await supabase
      .from('units')
      .update({
        status:      'reserved',
        reserved_by: user.id,
        reserved_at: new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      })
      .eq('id', unitId)
    if (unitErr) return { ok: false, error: unitErr.message }
  } else {
    await supabase
      .from('units')
      .update({
        status:      'reserved',
        reserved_by: user.id,
        reserved_at: new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      })
      .eq('id', unitId)
  }

  revalidatePath(`/dashboard/inventory/units/${unitId}`)
  revalidatePath('/dashboard/inventory/units')
  return { ok: true }
}

export async function cancelReservation(
  unitId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerClient()

  await supabase
    .from('unit_reservations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('unit_id', unitId)
    .eq('status', 'active')

  const { error } = await supabase
    .from('units')
    .update({ status: 'available', reserved_by: null, reserved_at: null, updated_at: new Date().toISOString() })
    .eq('id', unitId)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/inventory/units/${unitId}`)
  revalidatePath('/dashboard/inventory/units')
  return { ok: true }
}
