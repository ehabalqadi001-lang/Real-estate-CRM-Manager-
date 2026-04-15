'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. جلب المخزون العقاري الخاص بالشركة (الرادار)
export async function getProperties() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // معرفة رتبة المستخدم لتحديد ختم الشركة
  const { data: profile } = await supabase.from('profiles').select('role, account_type, company_id').eq('id', user.id).single()
  
  const isCompany = profile?.role === 'company_admin' || profile?.account_type === 'company'
  const targetCompanyId = isCompany ? user.id : profile?.company_id

  if (!targetCompanyId) return []

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('company_id', targetCompanyId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

interface PropertyPayload {
  propertyName?: string
  location?: string
  propertyType?: string
  price?: number
  commissionRate?: number
}

function isFormData(p: PropertyPayload | FormData): p is FormData {
  return typeof (p as FormData).get === 'function'
}

// 2. إضافة عقار جديد لترسانة الشركة
export async function addProperty(payload: PropertyPayload | FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const fd = isFormData(payload)
  const property_name = fd ? payload.get('propertyName') as string : payload.propertyName
  const location = fd ? payload.get('location') as string : payload.location
  const property_type = fd ? payload.get('propertyType') as string : payload.propertyType
  const price = fd ? Number(payload.get('price')) : Number(payload.price)
  const commission_rate = fd ? Number(payload.get('commissionRate')) : Number(payload.commissionRate)

  const { data: profile } = await supabase.from('profiles').select('role, account_type, company_id').eq('id', user.id).single()
  const isCompany = profile?.role === 'company_admin' || profile?.account_type === 'company'
  const targetCompanyId = isCompany ? user.id : profile?.company_id

  const { error } = await supabase.from('properties').insert({ 
    property_name: property_name || 'عقار جديد', 
    location: location || 'غير محدد',
    property_type: property_type || 'سكني', 
    price: price || 0, 
    commission_rate: commission_rate || 0,
    status: 'متاح',
    company_id: targetCompanyId 
  })

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/properties')
  return { success: true }
}

// 3. تحديث حالة العقار (متاح / مباع / محجوز)
export async function updatePropertyStatus(propertyId: string, newStatus: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  
  const { error } = await supabase.from('properties').update({ status: newStatus }).eq('id', propertyId)
  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/properties')
  return { success: true }
}

// 4. حذف العقار (صلاحية للمديرين فقط)
export async function deleteProperty(propertyId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  
  const { error } = await supabase.from('properties').delete().eq('id', propertyId)
  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/properties')
  return { success: true }
}