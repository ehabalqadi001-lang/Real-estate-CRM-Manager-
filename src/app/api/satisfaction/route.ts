import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/satisfaction?dealId=xxx — fetch score for a deal
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const dealId = req.nextUrl.searchParams.get('dealId')
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

  const { data } = await supabase
    .from('satisfaction_scores')
    .select('*')
    .eq('deal_id', dealId)
    .single()

  return NextResponse.json({ score: data ?? null })
}

// POST /api/satisfaction — submit a survey response (public, no auth)
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const body = await req.json() as {
    deal_id: string
    score: number         // 1-5
    comment?: string
    agent_rating?: number // 1-5
  }

  if (!body.deal_id || !body.score) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  if (body.score < 1 || body.score > 5) return NextResponse.json({ error: 'score must be 1-5' }, { status: 400 })

  const { error } = await supabase
    .from('satisfaction_scores')
    .upsert({
      deal_id:      body.deal_id,
      score:        body.score,
      comment:      body.comment ?? null,
      agent_rating: body.agent_rating ?? null,
    }, { onConflict: 'deal_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
