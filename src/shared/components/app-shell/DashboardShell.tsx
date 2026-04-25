import type { ReactNode } from 'react'
import type { CSSProperties } from 'react'
import { EnterpriseSidebar } from './EnterpriseSidebar'
import { EnterpriseTopbar } from './EnterpriseTopbar'
import type { AppProfile } from '@/shared/auth/types'
import type { CompanyOption } from '@/shared/company-context/server'

interface DashboardShellProps {
  children: ReactNode
  profile: AppProfile
  companyOptions?: CompanyOption[]
}

export function DashboardShell({ children, profile, companyOptions = [] }: DashboardShellProps) {
  const brandColor = normalizeBrandColor(profile.tenant_primary_brand_color)
  const shellStyle = brandColor
    ? ({
      '--fi-emerald': brandColor,
      '--fi-gradient-primary': `linear-gradient(135deg, ${brandColor}, #0f172a)`,
    } as CSSProperties)
    : undefined

  return (
    <div className="fi-shell-bg min-h-screen text-[var(--fi-ink)]" dir="ltr" style={shellStyle}>
      <div className="flex min-h-screen">
        <EnterpriseSidebar profile={profile} />
        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <EnterpriseTopbar profile={profile} companyOptions={companyOptions} />
          <div className="fi-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function normalizeBrandColor(color: string | null | undefined) {
  if (!color) return null
  return /^#[0-9a-f]{6}$/i.test(color) ? color : null
}
