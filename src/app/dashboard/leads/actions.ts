'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// 1. دالة تغيير حالة العميل (للسحب والإفلات)
export async function updateLeadStatus(leadId: string, newStatus: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
}

// 2. دالة إضافة عميل محتمل جديد
export async function addLead(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const payload = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    source: formData.get('source'),
    temperature: formData.get('temperature') || 'warm',
    status: 'fresh' // الحالة الافتراضية
  }

  const { error } = await supabase.from('leads').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
}