import { DashboardShell } from '@/shared/components/app-shell/DashboardShell'
import { requirePermission } from '@/shared/rbac/require-permission'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission('admin.view')

  return (
    <DashboardShell profile={session.profile}>
      {children}
    </DashboardShell>
  )
}
