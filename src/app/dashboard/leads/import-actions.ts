'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

interface LeadRow {
  name: string
  phone: string
  email?: string
  source?: string
  expected_value?: number
  notes?: string
  status?: string
}

export async function bulkImportLeads(rows: LeadRow[]) {
  if (!rows.length) throw new Error('لا توجد بيانات للاستيراد')
  if (rows.length > 500) throw new Error('الحد الأقصى 500 سجل في كل عملية استيراد')

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مصرح')

  const payload = rows.map(r => ({
    full_name: (r.name ?? '').trim(),
    phone: (r.phone ?? '').trim(),
    email: r.email?.trim() || null,
    source: r.source?.trim() || 'استيراد CSV',
    expected_value: Number(r.expected_value) || 0,
    notes: r.notes?.trim() || null,
    status: r.status?.trim() || 'Fresh Leads',
    company_id: user.id,
    agent_id: user.id,
  })).filter(r => r.full_name && r.phone)

  if (!payload.length) throw new Error('لا توجد صفوف صالحة (يجب توفر الاسم والهاتف على الأقل)')

  const { error, count } = await supabase.from('leads').insert(payload, { count: 'exact' })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/leads')
  return { imported: count ?? payload.length }
}
