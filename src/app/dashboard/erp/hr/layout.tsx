import { type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { Users, BadgeDollarSign, GraduationCap, Brain, UserSearch, CalendarDays, WalletCards, CalendarOff, ClipboardList, BarChart3, Star, FileText } from 'lucide-react'
import { requireSession } from '@/shared/auth/session'
import type { AppRole } from '@/shared/auth/types'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { HrNav } from './HrNav'
import { NotificationBell } from '@/components/hr/NotificationBell'
import type { NotifItem } from '@/components/hr/NotificationBell'

const HR_ROLES: AppRole[] = [
  'super_admin',
  'platform_admin',
  'hr_manager',
  'hr_staff',
  'hr_officer',
  'finance_manager',
]

const icons: Record<string, ReactNode> = {
  '/dashboard/erp/hr':              <Users className="size-4" />,
  '/dashboard/erp/hr/attendance':   <CalendarDays className="size-4" />,
  '/dashboard/erp/hr/leaves':       <CalendarOff className="size-4" />,
  '/dashboard/erp/hr/commission':   <BadgeDollarSign className="size-4" />,
  '/dashboard/erp/hr/payroll':      <WalletCards className="size-4" />,
  '/dashboard/erp/hr/talent':       <UserSearch className="size-4" />,
  '/dashboard/erp/hr/onboarding':   <ClipboardList className="size-4" />,
  '/dashboard/erp/hr/performance':  <Star className="size-4" />,
  '/dashboard/erp/hr/documents':    <FileText className="size-4" />,
  '/dashboard/erp/hr/academy':      <GraduationCap className="size-4" />,
  '/dashboard/erp/hr/hrbp':         <Brain className="size-4" />,
  '/dashboard/erp/hr/analytics':    <BarChart3 className="size-4" />,
}

export default async function HRLayout({ children }: { children: ReactNode }) {
  const session = await requireSession()
  if (!HR_ROLES.includes(session.profile.role)) redirect('/dashboard')

  const service = createServiceRoleClient()
  const { data: notifData } = await service
    .from('hr_notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('recipient_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const notifications = (notifData ?? []) as NotifItem[]

  return (
    <div dir="rtl" className="min-h-screen">
      <div className="relative">
        <HrNav icons={icons} />
        <div className="absolute left-3 top-1/2 z-40 -translate-y-1/2">
          <NotificationBell notifications={notifications} />
        </div>
      </div>
      {children}
    </div>
  )
}
