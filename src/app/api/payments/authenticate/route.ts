import { NextResponse } from 'next/server'
import { authenticatePaymob } from '@/lib/paymob/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const token = await authenticatePaymob()
    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Paymob authentication failed' }, { status: 502 })
  }
}
