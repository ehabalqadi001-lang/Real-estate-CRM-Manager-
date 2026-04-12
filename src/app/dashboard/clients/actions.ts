'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function addClient(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
      },
    }
  )

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string

  const { error } = await supabase
    .from('clients')
    .insert([{ name, phone, email, status: 'active' }])

  if (error) throw new Error(error.message)

  // تحديث الصفحة فوراً لظهور العميل الجديد في الجدول
  revalidatePath('/dashboard/clients')
}