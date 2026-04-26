import type { InputHTMLAttributes } from 'react'
import { Coins, CreditCard, KeyRound, Settings2, ShieldCheck, WalletCards } from 'lucide-react'
import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAdCosts, manualWalletOverride, updatePaymobSettings } from './actions'

export const dynamic = 'force-dynamic'

export default async function PointsAdminPage() {
  await requirePermission('platform.manage')
  const supabase = await createServerClient()

  const [
    { data: costs },
    { data: paymobSettings },
    { data: wallets },
    { data: userProfiles },
    { data: legacyUsers },
    { data: transactions },
  ] = await Promise.all([
    supabase.from('ad_cost_config').select('*').eq('id', true).maybeSingle(),
    supabase.from('paymob_settings').select('card_integration_id, wallet_integration_id, card_iframe_id, updated_at').eq('id', true).maybeSingle(),
    supabase
      .from('user_wallets')
      .select('id, user_id, points_balance, lifetime_points_earned, lifetime_points_spent, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('user_profiles')
      .select('id, full_name, company_id')
      .order('full_name')
      .limit(200),
    supabase
      .from('profiles')
      .select('id, full_name, email, company_name')
      .order('full_name')
      .limit(200),
    supabase
      .from('wallet_transactions')
      .select('id, user_id, type, points_delta, balance_after, money_amount, currency, reason, created_at, paymob_transaction_id')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const legacyById = new Map((legacyUsers ?? []).map((user) => [user.id, user]))
  const users = userProfiles && userProfiles.length > 0
    ? userProfiles.map((user) => {
      const legacy = legacyById.get(user.id)
      return {
        id: user.id,
        full_name: user.full_name,
        email: legacy?.email ?? null,
        company_name: legacy?.company_name ?? user.company_id ?? null,
      }
    })
    : legacyUsers ?? []
  const userById = new Map((users ?? []).map((user) => [user.id, user]))

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="ltr">
      <section className="rounded-lg border border-[#DDE6E4] bg-[#0B1120] p-6 text-white shadow-xl">
        <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#27AE60]">
          <ShieldCheck className="size-4" />
          FAST INVESTMENT Points Economy
        </p>
        <h1 className="mt-2 text-3xl font-black">Marketplace Ads Wallet Control</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
          Configure ad publication costs, Paymob payment credentials, and apply secure manual wallet adjustments.
        </p>
      </section>

      {/* Ad costs + Conversion rate */}
      <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <form action={updateAdCosts} className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Settings2 className="size-5 text-[#27AE60]" />
            <h2 className="font-black">Ad Cost Configurator</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Regular cost (pts)" name="regular_points_cost" type="number" defaultValue={String(costs?.regular_points_cost ?? 10)} />
            <Field label="Premium cost (pts)" name="premium_points_cost" type="number" defaultValue={String(costs?.premium_points_cost ?? 50)} />
            <Field label="Regular days" name="regular_duration_days" type="number" defaultValue={String(costs?.regular_duration_days ?? 30)} />
            <Field label="Premium days" name="premium_duration_days" type="number" defaultValue={String(costs?.premium_duration_days ?? 30)} />
            <div className="sm:col-span-2">
              <Field
                label="Points per EGP (conversion rate)"
                name="points_per_egp"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={String(costs?.points_per_egp ?? 10)}
              />
              <p className="mt-1 text-xs font-semibold text-[#64748B]">
                e.g. 10 = customer pays 1 EGP → receives 10 points
              </p>
            </div>
          </div>
          <Button className="mt-5 w-full bg-[#27AE60] text-white hover:bg-[#1F8E4F]">
            <Settings2 className="size-4" />
            Save costs
          </Button>
        </form>

        <form action={manualWalletOverride} className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Coins className="size-5 text-[#27AE60]" />
            <h2 className="font-black">Manual Override</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="user_id">User wallet</Label>
              <select id="user_id" name="user_id" className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                {(users ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name ?? user.email ?? user.id} {user.company_name ? `- ${user.company_name}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Points" name="points" type="number" min="1" defaultValue="100" />
            <div className="space-y-1.5">
              <Label htmlFor="direction">Direction</Label>
              <select id="direction" name="direction" className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                <option value="grant">Grant points</option>
                <option value="deduct">Deduct points</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" name="reason" placeholder="Cash payment, compensation, correction..." />
            </div>
          </div>
          <Button className="mt-5 w-full bg-[#0B1120] text-white hover:bg-[#1F2937]">
            <WalletCards className="size-4" />
            Apply override
          </Button>
        </form>
      </section>

      {/* Paymob credentials */}
      <section>
        <form action={updatePaymobSettings} className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="size-5 text-[#C9964A]" />
            <h2 className="font-black">Paymob API Credentials</h2>
            {paymobSettings?.updated_at && (
              <span className="ml-auto text-xs font-semibold text-[#64748B]">
                Last updated: {new Date(paymobSettings.updated_at).toLocaleDateString('en-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <p className="mb-4 text-xs font-semibold text-[#64748B]">
            Leave API Key and HMAC Secret blank to keep existing values. Credentials are stored securely and fall back to environment variables if blank.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="API Key (leave blank to keep)" name="api_key" type="password" placeholder="ak_••••••••••••••••••••" autoComplete="new-password" />
            <Field label="HMAC Secret (leave blank to keep)" name="hmac_secret" type="password" placeholder="••••••••••••••••••••" autoComplete="new-password" />
            <Field label="Card Integration ID" name="card_integration_id" type="text" defaultValue={paymobSettings?.card_integration_id ?? ''} placeholder="e.g. 4888832" />
            <Field label="Wallet Integration ID" name="wallet_integration_id" type="text" defaultValue={paymobSettings?.wallet_integration_id ?? ''} placeholder="e.g. 4888833" />
            <div className="sm:col-span-2">
              <Field label="Card iFrame ID" name="card_iframe_id" type="text" defaultValue={paymobSettings?.card_iframe_id ?? ''} placeholder="e.g. 916988" />
            </div>
          </div>
          <Button className="mt-5 bg-[#C9964A] text-white hover:bg-[#b8843a]">
            <CreditCard className="size-4" />
            Save Paymob credentials
          </Button>
        </form>
      </section>

      {/* Recent wallets */}
      <section className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm">
        <div className="border-b border-[#DDE6E4] px-5 py-4">
          <h2 className="font-black">Recent Wallets</h2>
        </div>
        <div className="divide-y divide-[#DDE6E4]">
          {(wallets ?? []).map((wallet) => {
            const owner = userById.get(wallet.user_id)
            return (
              <div key={wallet.id} className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_140px_140px_140px] md:items-center">
                <div>
                  <p className="font-black">{owner?.full_name ?? owner?.email ?? wallet.user_id}</p>
                  <p className="text-xs font-semibold text-[#64748B]">{owner?.company_name ?? 'Individual wallet'}</p>
                </div>
                <Metric label="Balance" value={wallet.points_balance} />
                <Metric label="Earned" value={wallet.lifetime_points_earned} />
                <Metric label="Spent" value={wallet.lifetime_points_spent} />
              </div>
            )
          })}
        </div>
      </section>

      {/* Transactions datatable */}
      <section className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm">
        <div className="border-b border-[#DDE6E4] px-5 py-4">
          <h2 className="font-black">All Transactions (last 50)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[#F6FAF7]">
              <tr>
                {['User', 'Type', 'Points', 'Balance After', 'EGP', 'Reason', 'Paymob TX ID', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE6E4]">
              {(transactions ?? []).map((tx) => {
                const owner = userById.get(tx.user_id)
                return (
                  <tr key={tx.id} className="transition hover:bg-[#F6FAF7]">
                    <td className="px-4 py-3 font-semibold">{owner?.full_name ?? owner?.email ?? tx.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${TX_TYPE_CLASSES[tx.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-black ${Number(tx.points_delta) >= 0 ? 'text-[#27AE60]' : 'text-red-500'}`}>
                      {Number(tx.points_delta) >= 0 ? '+' : ''}{Number(tx.points_delta).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold">{Number(tx.balance_after).toLocaleString()} pts</td>
                    <td className="px-4 py-3 font-semibold text-[#64748B]">
                      {tx.money_amount ? `${Number(tx.money_amount).toLocaleString()} ${tx.currency ?? 'EGP'}` : '—'}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 font-semibold text-[#64748B]">{tx.reason ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">
                      {tx.paymob_transaction_id ? tx.paymob_transaction_id.slice(0, 12) + '…' : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#64748B]">
                      {new Date(tx.created_at).toLocaleDateString('en-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(transactions ?? []).length === 0 && (
            <p className="p-8 text-center text-sm font-semibold text-[#64748B]">No transactions found.</p>
          )}
        </div>
      </section>
    </div>
  )
}

const TX_TYPE_CLASSES: Record<string, string> = {
  paymob_topup:  'bg-[#EEF6F5] text-[#27AE60]',
  manual_grant:  'bg-blue-50 text-blue-600',
  manual_deduct: 'bg-red-50 text-red-600',
  ad_spend:      'bg-[#FFF8EC] text-[#C9964A]',
}

function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, name, ...inputProps } = props
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...inputProps} />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#27AE60]">{Number(value ?? 0).toLocaleString()} pts</p>
    </div>
  )
}
