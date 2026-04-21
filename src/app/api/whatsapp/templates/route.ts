import { NextResponse } from 'next/server'
import { listWhatsAppTemplates, WhatsAppError } from '@/lib/whatsapp'
import { getCurrentSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  if (!hasPermission(session.profile.role, 'messages.whatsapp')) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  try {
    return NextResponse.json({ templates: await listWhatsAppTemplates() })
  } catch (error) {
    const status = error instanceof WhatsAppError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر تحميل القوالب.' }, { status })
  }
}
