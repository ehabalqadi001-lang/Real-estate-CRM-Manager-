import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Auto-assign a lead to the agent with the fewest active leads (round-robin by workload)
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { leadId: string; strategy?: 'round-robin' | 'least-loaded' }
  const { leadId, strategy = 'least-loaded' } = body

  // Get active agents for this company
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('company_id', user.id)
    .eq('role', 'agent')
    .eq('status', 'approved')

  if (!agents?.length) return NextResponse.json({ error: 'لا يوجد وكلاء نشطون' }, { status: 422 })

  let assignTo: string

  if (strategy === 'least-loaded') {
    // Count active (non-won, non-lost) leads per agent
    const counts = await Promise.all(agents.map(async a => {
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', a.id)
        .not('status', 'in', '("Won","Lost")')
      return { id: a.id, name: a.full_name, count: count ?? 0 }
    }))
    counts.sort((a, b) => a.count - b.count)
    assignTo = counts[0].id
  } else {
    // Round-robin: assign to next agent after the lead's current agent
    const { data: lead } = await supabase.from('leads').select('agent_id').eq('id', leadId).single()
    const currentIdx = agents.findIndex(a => a.id === lead?.agent_id)
    assignTo = agents[(currentIdx + 1) % agents.length].id
  }

  const { error } = await supabase
    .from('leads')
    .update({ agent_id: assignTo })
    .eq('id', leadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const assigned = agents.find(a => a.id === assignTo)
  return NextResponse.json({ ok: true, assignedTo: assigned?.full_name ?? assignTo })
}
