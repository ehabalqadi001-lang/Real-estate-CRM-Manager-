import { requireSession } from '@/shared/auth/session'
import { DashboardShell } from '@/shared/components/app-shell/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  return (
    <DashboardShell profile={session.profile}>
      {children}
    </DashboardShell>
  )
}
