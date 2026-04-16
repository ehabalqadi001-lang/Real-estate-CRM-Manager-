'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateDealStage(dealId: string, newStage: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { error } = await supabase
    .from('deals')
    .update({ stage: newStage })
    .eq('id', dealId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/deals/kanban')
}
