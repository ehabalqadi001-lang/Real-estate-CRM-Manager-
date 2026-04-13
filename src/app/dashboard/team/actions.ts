'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getTeamMembers() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data } = await supabase.from('team_members').select('*').order('name')
  return data || []
}

export async function addTeamMember(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const payload = {
    name: formData.get('name'),
    role: formData.get('role'),
    phone: formData.get('phone'),
    email: formData.get('email')
  }

  const { error } = await supabase.from('team_members').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/team')
}

// دالة مخصصة لإسناد عميل لموظف
export async function assignLeadToMember(leadId: string, memberId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { error } = await supabase
    .from('leads')
    .update({ assigned_to: memberId })
    .eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
}