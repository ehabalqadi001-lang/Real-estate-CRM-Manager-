'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

function getSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

export async function addRule(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const usePercentage = formData.get('use_percentage') === 'true'
  const { error } = await supabase.from('commission_rules').insert({
    name:            formData.get('name') as string,
    commission_type: formData.get('commission_type') as string,
    project_name:    (formData.get('project_name') as string) || null,
    percentage:      usePercentage ? parseFloat(formData.get('percentage') as string) || 0 : 0,
    flat_amount:     !usePercentage ? parseFloat(formData.get('flat_amount') as string) || 0 : null,
    use_percentage:  usePercentage,
    is_active:       true,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/commissions/rules')
}

export async function toggleRule(id: string, isActive: boolean) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { error } = await supabase
    .from('commission_rules')
    .update({ is_active: !isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/commissions/rules')
}

export async function calculateCommission(dealValue: number, projectName?: string, commissionType = 'agent'): Promise<number> {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  // Find best matching rule: project-specific first, then global
  const { data: rules } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('commission_type', commissionType)
    .eq('is_active', true)
    .order('project_name', { nullsFirst: false }) // project-specific first

  if (!rules?.length) return 0

  const rule =
    rules.find(r => r.project_name && r.project_name === projectName) ??
    rules.find(r => !r.project_name) ??
    rules[0]

  if (rule.use_percentage) {
    return (dealValue * rule.percentage) / 100
  }
  return rule.flat_amount ?? 0
}
