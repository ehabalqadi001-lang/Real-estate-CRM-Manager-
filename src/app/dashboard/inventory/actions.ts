'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. جلب قائمة المطورين
export async function getDevelopersList() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data } = await supabase.from('developers').select('id, name').order('name')
  return data || []
}

// 2. إضافة وحدة واحدة يدوياً
export async function addSingleUnit(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const payload = {
    unit_name: formData.get('unit_name'),
    developer_id: formData.get('developer_id'),
    unit_type: formData.get('unit_type'),
    price: parseFloat(formData.get('price') as string) || 0,
    status: formData.get('status') || 'available'
  }

  const { error } = await supabase.from('inventory').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/inventory')
}

// 3. إضافة مجمعة من ملف Excel
export async function addBulkUnits(units: any[], developer_id: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  // تجهيز البيانات لتطابق قاعدة البيانات
  const payload = units.map(unit => ({
    unit_name: unit['اسم الوحدة'] || unit['Unit Name'] || 'وحدة غير مسماة',
    unit_type: unit['النوع'] || unit['Type'] || 'غير محدد',
    price: parseFloat(unit['السعر'] || unit['Price']) || 0,
    status: 'available', // الافتراضي
    developer_id: developer_id
  }))

  const { error } = await supabase.from('inventory').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/inventory')
}