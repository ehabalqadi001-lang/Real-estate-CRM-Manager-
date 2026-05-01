import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/shared/auth/session'
import { createServiceRoleClient } from '@/lib/supabase/service'
import type { AppRole } from '@/shared/auth/types'

const ALLOWED_ROLES: AppRole[] = ['super_admin', 'platform_admin', 'hr_manager', 'hr_staff', 'hr_officer', 'finance_manager']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const session = await requireSession()
    if (!ALLOWED_ROLES.includes(session.profile.role)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { path } = await params
    const filePath = path.join('/')

    const service = createServiceRoleClient()
    const { data, error } = await service.storage
      .from('documents')
      .download(filePath)

    if (error || !data) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const arrayBuffer = await data.arrayBuffer()
    const contentType = data.type || 'application/octet-stream'
    const fileName = filePath.split('/').pop() ?? 'document'

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('Server Error', { status: 500 })
  }
}
