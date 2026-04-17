import 'server-only'

import { redirect } from 'next/navigation'
import { requireSession } from '@/shared/auth/session'
import { hasPermission, type Permission } from './permissions'

export async function requirePermission(permission: Permission) {
  const session = await requireSession()

  if (!hasPermission(session.profile.role, permission)) {
    redirect('/dashboard')
  }

  return session
}

