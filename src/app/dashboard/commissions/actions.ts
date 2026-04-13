'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. جلب العمولات للصفحة الرئيسية
export async function getCommissions() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data, error } = await supabase
    .from('commissions')
    .select('*, deals(title, value), team_members(name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

// 2. تغيير حالة العمولة إلى (تم الصرف)
export async function payCommission(commissionId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { error } = await supabase.from('commissions')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', commissionId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/commissions')
}

// 3. إضافة عمولة جديدة
export async function addCommission(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const payload = {
    deal_id: formData.get('deal_id'),
    member_id: formData.get('member_id') || null,
    amount: parseFloat(formData.get('amount') as string) || 0,
    status: formData.get('status') || 'pending'
  }
  const { error } = await supabase.from('commissions').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/commissions')
}

// 4. دوال مساعدة لجلب البيانات للنافذة المنبثقة
export async function getActiveDeals() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data } = await supabase.from('deals').select('id, title').neq('status', 'lost')
  return data || []
}

export async function getActiveTeam() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data } = await supabase.from('team_members').select('id, name')
  return data || []
}