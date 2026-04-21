import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { WhatsAppHubClient, type WhatsAppHubUser } from './WhatsAppHubClient'

export const dynamic = 'force-dynamic'

export default async function AdminWhatsAppPage() {
  await requirePermission('messages.read')

  const supabase = await createRawClient()
  const [{ data: userProfiles }, { data: legacyProfiles }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name, phone, role, account_type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, account_type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const legacyById = new Map((legacyProfiles ?? []).map((profile) => [profile.id, profile]))
  const users = (userProfiles && userProfiles.length > 0
    ? userProfiles.map((profile) => ({ ...profile, email: legacyById.get(profile.id)?.email ?? null }))
    : legacyProfiles ?? []) as WhatsAppHubUser[]

  return (
    <div className="space-y-5 font-cairo" dir="rtl">
      <WhatsAppHubClient users={users} />
    </div>
  )
}
