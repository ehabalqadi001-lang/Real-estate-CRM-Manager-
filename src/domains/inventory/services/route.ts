import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/developer/projects
 * Retrieves available projects for the currently authenticated developer account.
 * Part of Phase 2: Developer Hub API.
 */
export async function GET(req: Request) {
  const supabase = await createServerClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()

  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 })
  }

  // 1. Verify user is attached to a developer account
  const { data: devAccount } = await supabase
    .from('developer_accounts')
    .select('developer_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!devAccount) {
    return NextResponse.json({ error: 'Forbidden: No active developer account found for this user.' }, { status: 403 })
  }

  const { data: projects, error: projectsError } = await supabase.from('projects').select('id, name, masterplan_url, trust_score, created_at').eq('developer_id', devAccount.developer_id)
  return projectsError ? NextResponse.json({ error: projectsError.message }, { status: 500 }) : NextResponse.json({ success: true, projects })
}