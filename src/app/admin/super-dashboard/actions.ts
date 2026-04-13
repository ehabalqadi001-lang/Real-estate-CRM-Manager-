'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// جلب الإحصائيات الشاملة للمنصة (Super Stats)
export async function getSuperStats() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { count: companiesCount } = await supabase.from('companies').select('*', { count: 'exact', head: true })
  const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { data: deals } = await supabase.from('deals').select('value').eq('status', 'won')
  
  const totalGlobalSales = deals?.reduce((sum, d) => sum + Number(d.value), 0) || 0

  return { companiesCount: companiesCount || 0, usersCount: usersCount || 0, totalGlobalSales }
}

// إضافة إعلان جديد للمنصة
export async function createAnnouncement(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const payload = {
    title: formData.get('title'),
    body: formData.get('body'),
    type: formData.get('type') || 'banner',
    target_audience: formData.get('target_audience') || 'all',
    color: formData.get('color') || 'blue'
  }

  const { error } = await supabase.from('announcements').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/admin/super-dashboard')
}