import type { ReactNode } from 'react'
import { EnterpriseSidebar } from './EnterpriseSidebar'
import type { AppProfile } from '@/shared/auth/types'

interface DashboardShellProps {
  children: ReactNode
  profile: AppProfile
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950" dir="rtl">
      <div className="flex min-h-screen">
        <EnterpriseSidebar profile={profile} />
        <main className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <p className="text-sm font-black">FAST INVESTMENT</p>
            <p className="text-xs text-slate-500">{profile.full_name ?? profile.email}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

