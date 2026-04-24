import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/shared/auth/session'
import { isBrokerRole } from '@/shared/auth/types'

export default async function RootPage() {
  const session = await getCurrentSession()
  if (session && isBrokerRole(session.profile.role)) {
    redirect('/broker-portal')
  }
  redirect('/dashboard')
}
