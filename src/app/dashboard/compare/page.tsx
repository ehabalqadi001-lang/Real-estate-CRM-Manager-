import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CompareClient from './CompareClient'

export const dynamic = 'force-dynamic'

interface Unit {
  id: string
  unit_name: string
  project_name: string
  unit_type: string
  price: number
  area?: number
  floor?: number
  finishing?: string
  status: string
  developer?: string
}

export default async function ComparePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'available')
    .order('price', { ascending: true })

  const units: Unit[] = data || []

  return <CompareClient units={units} />
}
