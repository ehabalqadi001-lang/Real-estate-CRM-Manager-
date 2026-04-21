import { NextResponse, type NextRequest } from 'next/server'
import { getWhatsAppConversation, WhatsAppError } from '@/lib/whatsapp'
import { getCurrentSession } from '@/shared/auth/session'
import { hasPermission } from '@/shared/rbac/permissions'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  if (!hasPermission(session.profile.role, 'messages.read')) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const phone = request.nextUrl.searchParams.get('phone') ?? ''
  if (!phone) {
    return NextResponse.json({ error: 'phone is required.' }, { status: 400 })
  }

  try {
    return NextResponse.json({ messages: await getWhatsAppConversation(phone, 80) })
  } catch (error) {
    const status = error instanceof WhatsAppError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر تحميل المحادثة.' }, { status })
  }
}
