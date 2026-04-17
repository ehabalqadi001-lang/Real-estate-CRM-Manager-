import { redirect } from 'next/navigation'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import ClientProfileDashboard from '@/components/marketplace/ClientProfileDashboard'
import { createServerClient } from '@/lib/supabase/server'
import type { MarketplaceUser } from '@/domains/marketplace/types'

export const dynamic = 'force-dynamic'

export default async function ClientProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone, region, preferred_contact, client_notes, role, status')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('ads')
      .select('id, title, status, created_at, price')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const profileData = {
    full_name: profile?.full_name ?? user.email ?? 'عميل FAST INVESTMENT',
    email: profile?.email ?? user.email ?? null,
    phone: profile?.phone ?? null,
    region: profile?.region ?? null,
    preferred_contact: profile?.preferred_contact ?? 'whatsapp',
    client_notes: profile?.client_notes ?? null,
    role: profile?.role ?? 'CLIENT',
    status: profile?.status ?? 'active',
  }

  const currentUser: MarketplaceUser = {
    id: user.id,
    email: user.email ?? null,
    name: profileData.full_name ?? user.email ?? 'عميل',
    role: profileData.role,
  }

  return (
    <div className="min-h-screen bg-[#FBFCFA] text-[#102033]" dir="rtl">
      <MarketplaceHeader user={currentUser} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <ClientProfileDashboard profile={profileData} listings={listings ?? []} />
      </main>
    </div>
  )
}
