'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

function getSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

export async function addResaleListing(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('resale_listings').insert({
    agent_id:      user.id,
    project_name:  formData.get('project_name') as string,
    unit_type:     (formData.get('unit_type') as string) || 'شقة',
    floor:         formData.get('floor') ? parseInt(formData.get('floor') as string) : null,
    area_sqm:      formData.get('area_sqm') ? parseFloat(formData.get('area_sqm') as string) : null,
    bedrooms:      formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string) : null,
    finishing:     (formData.get('finishing') as string) || null,
    asking_price:  parseFloat(formData.get('asking_price') as string),
    original_price: formData.get('original_price') ? parseFloat(formData.get('original_price') as string) : null,
    seller_name:   (formData.get('seller_name') as string) || null,
    seller_phone:  (formData.get('seller_phone') as string) || null,
    seller_notes:  (formData.get('seller_notes') as string) || null,
    status:        'active',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/resale')
}

export async function updateResaleStatus(id: string, status: string) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { error } = await supabase
    .from('resale_listings')
    .update({ status, ...(status === 'sold' ? { sold_at: new Date().toISOString() } : {}) })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/resale')
}
