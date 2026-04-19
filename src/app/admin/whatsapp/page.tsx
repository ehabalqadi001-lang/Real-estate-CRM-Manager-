import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { WhatsAppHubClient, type WhatsAppHubUser } from './WhatsAppHubClient'

export const dynamic = 'force-dynamic'

export default async function AdminWhatsAppPage() {
  await requirePermission('messages.read')

  const supabase = await createRawClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, account_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  const users = (data ?? []) as WhatsAppHubUser[]

  return (
    <div className="space-y-5 font-cairo" dir="rtl">
      <WhatsAppHubClient users={users} />
    </div>
  )
}
