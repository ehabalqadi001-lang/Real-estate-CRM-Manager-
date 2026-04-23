import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/shared/auth/session'
import { isManagerRole, isSuperAdmin } from '@/shared/auth/types'
import { getFastKnowledgeStatus, ingestFastKnowledge } from '@/lib/fast-agent/knowledge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthorizedSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح بإدارة ذاكرة FAST' }, { status: 403 })
  }

  const status = await getFastKnowledgeStatus(session)
  return NextResponse.json({ ok: true, ...status })
}

export async function POST() {
  const session = await getAuthorizedSession()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح بتجهيز ذاكرة FAST' }, { status: 403 })
  }

  const result = await ingestFastKnowledge(session)
  return NextResponse.json(result)
}

async function getAuthorizedSession() {
  const session = await getCurrentSession()
  if (!session || (!isManagerRole(session.profile.role) && !isSuperAdmin(session.profile.role))) return null
  return session
}
