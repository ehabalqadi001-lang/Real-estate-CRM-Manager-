'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// دالة تحديث حالة العمولة (معتمدة أو تم صرفها)
export async function updateCommissionStatus(commissionId: string, newStatus: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // تحديث الحالة وتوثيق وقت الصرف إذا كانت الحالة "تم الدفع"
  const updateData: Record<string, string> = { status: newStatus }
  if (newStatus === 'paid') {
    updateData.paid_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('commissions')
    .update(updateData)
    .eq('id', commissionId)

  if (error) throw new Error(error.message)

  revalidatePath('/company/financials')
  return { success: true }
}