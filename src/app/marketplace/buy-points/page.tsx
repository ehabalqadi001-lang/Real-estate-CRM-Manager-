import { redirect } from 'next/navigation'
import { Coins, ShieldCheck, Wallet } from 'lucide-react'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'
import { createServerClient } from '@/lib/supabase/server'
import type { MarketplaceUser } from '@/domains/marketplace/types'
import { TopUpCheckout } from './TopUpCheckout'

export const dynamic = 'force-dynamic'

export default async function BuyPointsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; wallet?: string; order?: string; token?: string }>
}) {
  const feedback = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: wallet }, { data: packages }] = await Promise.all([
    supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle(),
    supabase.from('user_wallets').select('points_balance, lifetime_points_earned, lifetime_points_spent').eq('user_id', user.id).maybeSingle(),
    supabase.from('point_packages').select('id, name, description, package_kind, amount_egp, currency, points_amount').eq('is_active', true).order('sort_order'),
  ])

  const currentUser: MarketplaceUser = {
    id: user.id,
    email: user.email ?? null,
    name: profile?.full_name ?? user.email ?? 'Marketplace user',
    role: profile?.role ?? null,
  }

  return (
    <div className="min-h-screen bg-[#FBFCFA] text-[#102033]" dir="ltr">
      <MarketplaceHeader user={currentUser} />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <section className="rounded-lg border border-[#DDE6E4] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#27AE60]">
                <Coins className="size-4" />
                Marketplace Ads Wallet
              </p>
              <h1 className="mt-2 text-3xl font-black">Buy Points</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#64748B]">
                Points are used exclusively to publish Regular and Premium marketplace ads. Paymob live payments top up this wallet after signed webhook confirmation.
              </p>
            </div>
            <div className="rounded-lg bg-[#27AE60] px-5 py-4 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em]">Balance</p>
              <p className="mt-1 text-3xl font-black">{Number(wallet?.points_balance ?? 0).toLocaleString()} pts</p>
            </div>
          </div>
        </section>

        {feedback.success && (
          <div className="rounded-lg border border-[#27AE60]/25 bg-[#27AE60]/10 p-4 text-sm font-black text-[#1E874B]">
            Payment received. Paymob will credit points as soon as the webhook is processed.
          </div>
        )}
        {feedback.canceled && (
          <div className="rounded-lg border border-[#C9964A]/30 bg-[#FFF8EC] p-4 text-sm font-black text-[#9A6B26]">
            Checkout was canceled. Your wallet was not charged.
          </div>
        )}
        {feedback.wallet && (
          <div className="rounded-lg border border-[#27AE60]/25 bg-[#27AE60]/10 p-4 text-sm font-bold leading-6 text-[#1E874B]">
            Mobile wallet payment is ready for Paymob order {feedback.order}. Use the returned wallet token to complete the charge: <span className="break-all font-black">{feedback.token}</span>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {(packages ?? []).map((pack) => (
            <TopUpCheckout key={pack.id} pointPackage={pack} />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard icon={Wallet} title="Spending rules" body="Regular ads spend the Regular configured cost. Premium ads spend the Premium configured cost and rank first in marketplace search." />
          <InfoCard icon={ShieldCheck} title="Security" body="Wallet credits are idempotent by Paymob transaction ID. Manual overrides are restricted to Super Admin platform permissions." />
        </section>
      </main>
    </div>
  )
}

function InfoCard({ icon: Icon, title, body }: { icon: typeof Wallet; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
      <Icon className="size-5 text-[#27AE60]" />
      <p className="mt-3 font-black">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">{body}</p>
    </div>
  )
}
