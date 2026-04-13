'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. دالة إضافة الصفقة
export async function addDeal(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const title = formData.get('title') as string
  const value = parseFloat(formData.get('value') as string)
  const status = formData.get('status') as string
  const client_id = formData.get('client_id') as string

  const { error } = await supabase
    .from('deals')
    .insert([{ title, value, status, client_id }])

  if (error) throw new Error(error.message)

  // تحديث صفحة الصفقات والداشبورد لتسميع الأرقام
  revalidatePath('/dashboard/deals')
  revalidatePath('/dashboard') 
}

// 2. دالة جلب العملاء للقائمة المنسدلة
export async function getClientsList() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data } = await supabase.from('clients').select('id, name')
  return data || []
}