import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requireSession } from '@/shared/auth/session'
import { isManagerRole, isSuperAdmin } from '@/shared/auth/types'

export async function GET(request: Request) {
  try {
    const session = await requireSession()
    
    if (!isManagerRole(session.profile.role) && !isSuperAdmin(session.profile.role) && session.profile.role !== 'account_manager') {
      return new NextResponse('Unauthorized: Access Denied', { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return new NextResponse('Bad Request: Missing document path', { status: 400 })
    }

    const service = createServiceRoleClient()
    const { data, error } = await service.storage.from('documents').createSignedUrl(path, 60 * 10)

    if (error || !data?.signedUrl) {
      return new NextResponse('Not Found: File not found or access denied', { status: 404 })
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (err) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}