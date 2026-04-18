import type { ReactNode } from 'react'
import { EnterpriseSidebar } from './EnterpriseSidebar'
import { EnterpriseTopbar } from './EnterpriseTopbar'
import type { AppProfile } from '@/shared/auth/types'

interface DashboardShellProps {
  children: ReactNode
  profile: AppProfile
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  return (
    <div className="fi-shell-bg min-h-screen text-[var(--fi-ink)]" dir="rtl">
      <div className="flex min-h-screen">
        <EnterpriseSidebar profile={profile} />
        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <EnterpriseTopbar profile={profile} />
          {children}
        </main>
      </div>
    </div>
  )
}
