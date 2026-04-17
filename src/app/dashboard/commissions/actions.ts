'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
// email notifications available via sendCommissionPaidEmail from '@/lib/email'

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
    .select('*, deals(title, unit_value), team_members!team_member_id(name)')
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

  // Fetch commission details for email
  const { data: commission } = await supabase
    .from('commissions')
    .select('amount, commission_type, beneficiary_name, deals(title)')
    .eq('id', commissionId)
    .single()

  const { error } = await supabase.from('commissions')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', commissionId)
  if (error) throw new Error(error.message)

  if (commission) {
    void commission.beneficiary_name
  }

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
  const dealValueRaw = formData.get('deal_value')
  const percentageRaw = formData.get('percentage')
  const memberIdRaw = formData.get('member_id') as string | null
  const payload = {
    deal_id: formData.get('deal_id'),
    team_member_id: memberIdRaw || null,
    amount: parseFloat(formData.get('amount') as string) || 0,
    total_amount: parseFloat(formData.get('amount') as string) || 0,
    status: formData.get('status') || 'pending',
    commission_type: formData.get('commission_type') || 'agent',
    deal_value: dealValueRaw ? parseFloat(dealValueRaw as string) : null,
    percentage: percentageRaw ? parseFloat(percentageRaw as string) : null,
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
  const { data } = await supabase.from('deals').select('id, title, unit_value').neq('status', 'lost')
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