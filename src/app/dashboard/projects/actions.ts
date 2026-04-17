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

export async function addProject(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { error } = await supabase.from('projects').insert({
    name:          formData.get('name') as string,
    location:      (formData.get('location') as string) || null,
    launch_date:   (formData.get('launch_date') as string) || null,
    delivery_date: (formData.get('delivery_date') as string) || null,
    status:        'active',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/projects')
}
