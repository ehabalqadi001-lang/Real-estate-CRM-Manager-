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

  const [
    { data: profile },
    { data: listings },
    { data: wallet },
    { data: transactions },
    { data: supportTickets },
    { data: packages },
  ] = await Promise.all([
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
    supabase
      .from('user_wallets')
      .select('points_balance, lifetime_points_earned, lifetime_points_spent')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('wallet_transactions')
      .select('id, type, points_delta, balance_after, money_amount, currency, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('support_tickets')
      .select('id, title, status, priority, category, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('point_packages')
      .select('id, name, amount_egp, currency, points_amount')
      .eq('is_active', true)
      .order('sort_order')
      .limit(3),
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#E9F4EF_0%,#F7FAF8_52%,#FBFCFA_100%)] text-[#102033]" dir="rtl">
      <MarketplaceHeader user={currentUser} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <ClientProfileDashboard
          profile={profileData}
          listings={listings ?? []}
          wallet={wallet ?? null}
          transactions={transactions ?? []}
          supportTickets={supportTickets ?? []}
          pointPackages={packages ?? []}
        />
      </main>
    </div>
  )
}
