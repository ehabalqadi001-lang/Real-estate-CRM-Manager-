'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// دالة توثيق إنجاز المهمة (Mark as Done)
export async function markActivityAsDone(activityId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { error } = await supabase
    .from('activities')
    .update({ 
      done_at: new Date().toISOString(), 
      outcome: 'completed' 
    })
    .eq('id', activityId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/activities')
  return { success: true }
}