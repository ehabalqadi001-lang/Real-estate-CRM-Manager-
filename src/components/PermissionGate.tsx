'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Permission } from '@/lib/permissions'

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission | string
  fallback?: ReactNode
  children: ReactNode
}) {
  const { loading, hasPermission } = useAuth()

  if (loading) return null
  if (!hasPermission(permission)) return <>{fallback}</>
  return <>{children}</>
}
