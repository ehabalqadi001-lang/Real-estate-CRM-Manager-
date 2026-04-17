import { redirect } from 'next/navigation'
import { requireSession } from '@/shared/auth/session'
import { isBrokerRole, isManagerRole } from '@/shared/auth/types'
import BrokerPortalShell from '@/components/broker-portal/BrokerPortalShell'

export const metadata = { title: 'بوابة الوسيط | FAST INVESTMENT' }

export default async function BrokerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()
  const role = session.profile.role

  // السماح للوسطاء والمدراء (للمراجعة)
  if (!isBrokerRole(role) && !isManagerRole(role)) {
    redirect('/dashboard')
  }

  return <BrokerPortalShell profile={session.profile}>{children}</BrokerPortalShell>
}
