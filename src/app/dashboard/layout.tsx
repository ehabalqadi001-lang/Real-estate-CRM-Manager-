import { requireSession } from '@/shared/auth/session'
import { DashboardShell } from '@/shared/components/app-shell/DashboardShell'
import { getActiveCompanyContext } from '@/shared/company-context/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const companyContext = await getActiveCompanyContext(session)
  const profile = {
    ...session.profile,
    active_company_id: companyContext.companyId,
    active_company_name: companyContext.companyName,
    company_id: companyContext.companyId ?? session.profile.company_id,
  }

  return (
    <DashboardShell profile={profile} companyOptions={companyContext.options}>
      {children}
    </DashboardShell>
  )
}
