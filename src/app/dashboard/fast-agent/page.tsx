import { redirect } from 'next/navigation'
import { FastKnowledgeAdmin } from '@/components/fast-agent/FastKnowledgeAdmin'
import { getFastKnowledgeStatus } from '@/lib/fast-agent/knowledge'
import { requireSession } from '@/shared/auth/session'
import { isManagerRole, isSuperAdmin } from '@/shared/auth/types'

export const dynamic = 'force-dynamic'

export default async function FastAgentAdminPage() {
  const session = await requireSession()
  if (!isManagerRole(session.profile.role) && !isSuperAdmin(session.profile.role)) redirect('/dashboard')

  const status = await getFastKnowledgeStatus(session)

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <FastKnowledgeAdmin initialStatus={status} />
    </main>
  )
}
