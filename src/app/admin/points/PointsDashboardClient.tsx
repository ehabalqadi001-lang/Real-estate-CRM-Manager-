"use client"

import type { InputHTMLAttributes } from 'react'
import {
  Activity,
  Coins,
  CreditCard,
  KeyRound,
  Package,
  Settings2,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  manualWalletOverride,
  savePointPackage,
  togglePointPackageAvailability,
  updateAdCosts,
  updatePaymobSettings,
} from './actions'
import { GamificationDashboard } from './GamificationDashboard'
import { SubmitButton } from './SubmitButton'

const TX_TYPE_CLASSES: Record<string, string> = {
  paymob_topup: 'bg-[#EEF6F5] text-[#27AE60]',
  manual_grant: 'bg-blue-50 text-blue-600',
  manual_deduct: 'bg-red-50 text-red-600',
  ad_spend: 'bg-[#FFF8EC] text-[#C9964A]',
}

function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, name, id, ...inputProps } = props
  const fieldId = id ?? name
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} name={name} {...inputProps} />
    </div>
  )
}

function Metric({ label, value, suffix = 'pts' }: { label: string; value: number | string | null; suffix?: string }) {
  const formatted = typeof value === 'number' ? value.toLocaleString() : value ?? '0'
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#27AE60]">
        {formatted} {suffix}
      </p>
    </div>
  )
}

function PackageEditor({
  pointPackage,
}: {
  pointPackage?: any
}) {
  const isNew = !pointPackage?.id
  const packageKind = pointPackage?.package_kind ?? 'one_time'
  const isActive = isNew ? true : Boolean(pointPackage?.is_active)
  const idPrefix = pointPackage?.id ?? 'new'

  return (
    <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-[#0B1120]">{isNew ? 'Create New Offer' : pointPackage.name}</h3>
          <p className="text-xs font-semibold text-[#64748B]">
            {isNew
              ? 'Add a new package that appears in the marketplace buy-points page.'
              : `Package ID: ${pointPackage.id}`}
          </p>
        </div>
        {!isNew && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-black ${
              isActive ? 'bg-[#EEF6F5] text-[#27AE60]' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isActive ? 'Active' : 'Hidden'}
          </span>
        )}
      </div>

      <form action={savePointPackage} className="space-y-4">
        <input type="hidden" name="package_id" value={pointPackage?.id ?? ''} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Package name" name="name" id={`name_${idPrefix}`} defaultValue={pointPackage?.name ?? ''} placeholder="Starter Pack" required />
          <div className="space-y-1.5">
            <Label htmlFor={`package_kind_${idPrefix}`}>Package type</Label>
            <select
              id={`package_kind_${idPrefix}`}
              name="package_kind"
              defaultValue={packageKind}
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="one_time">One-time</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor={`description_${idPrefix}`}>Description</Label>
            <Textarea
              id={`description_${idPrefix}`}
              name="description"
              defaultValue={pointPackage?.description ?? ''}
              placeholder="500 EGP = 5,000 marketplace ad points"
              className="min-h-[84px]"
            />
          </div>
          <Field
            label="Amount (EGP)"
            name="amount_egp"
            id={`amount_egp_${idPrefix}`}
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={String(pointPackage?.amount_egp ?? 150)}
            required
          />
          <Field label="Points amount" name="points_amount" id={`points_amount_${idPrefix}`} type="number" min="1" step="1" defaultValue={String(pointPackage?.points_amount ?? 1500)} required />
          <Field label="Currency" name="currency" id={`currency_${idPrefix}`} defaultValue={pointPackage?.currency ?? 'EGP'} maxLength={8} required />
          <Field label="Sort order" name="sort_order" id={`sort_order_${idPrefix}`} type="number" min="0" step="1" defaultValue={String(pointPackage?.sort_order ?? 0)} required />
          <div className="space-y-1.5">
            <Label htmlFor={`billing_interval_${idPrefix}`}>Billing interval</Label>
            <select
              id={`billing_interval_${idPrefix}`}
              name="billing_interval"
              defaultValue={pointPackage?.billing_interval ?? (packageKind === 'subscription' ? 'month' : '')}
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Not applicable</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-[#DDE6E4] px-3 py-2 text-sm font-semibold text-[#334155]">
            <input type="checkbox" name="is_active" defaultChecked={isActive} className="size-4 rounded border-[#DDE6E4]" />
            Visible in marketplace
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <SubmitButton type="submit" icon={Package} className="bg-[#27AE60] text-white hover:bg-[#1F8E4F]">
            {isNew ? 'Create package' : 'Save package'}
          </SubmitButton>
        </div>
      </form>

      {!isNew && (
        <form action={togglePointPackageAvailability} className="mt-3">
          <input type="hidden" name="package_id" value={pointPackage.id} />
          <input type="hidden" name="next_active" value={String(!isActive)} />
          <SubmitButton type="submit" className="bg-[#0B1120] text-white hover:bg-[#1F2937]">
            {isActive ? 'Hide package' : 'Activate package'}
          </SubmitButton>
        </form>
      )}
    </div>
  )
}

interface PointsDashboardClientProps {
  costs: any
  paymobSettings: any
  pointPackages: any[]
  wallets: any[]
  users: any[]
  transactions: any[]
  gamificationUsers: any[]
  totalCirculatingPoints: number
  totalLifetimeEarned: number
  recentTopupsEGP: number
}

export function PointsDashboardClient({
  costs,
  paymobSettings,
  pointPackages,
  wallets,
  users,
  transactions,
  gamificationUsers,
  totalCirculatingPoints,
  totalLifetimeEarned,
  recentTopupsEGP,
}: PointsDashboardClientProps) {
  const userById = new Map<string, any>((users ?? []).map((user) => [user.id, user]))
  const activePackagesCount = (pointPackages ?? []).filter((item) => item.is_active).length

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="ltr">
      <section className="rounded-lg border border-[#DDE6E4] bg-[#0B1120] p-6 text-white shadow-xl">
        <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#27AE60]">
          <ShieldCheck className="size-4" />
          FAST INVESTMENT Points Economy
        </p>
        <h1 className="mt-2 text-3xl font-black">Marketplace Ads Wallet Control</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
          Configure ad publication costs, maintain the public offers catalog, manage Paymob credentials, and apply secure wallet adjustments.
        </p>
      </section>

      <GamificationDashboard users={gamificationUsers} />

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2 text-sm font-bold text-[#64748B]">
            <Activity className="size-4 text-[#27AE60]" />
            Circulating Points
          </div>
          <p className="mt-2 text-3xl font-black text-[#0B1120]">{totalCirculatingPoints.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2 text-sm font-bold text-[#64748B]">
            <TrendingUp className="size-4 text-[#27AE60]" />
            Lifetime Issued
          </div>
          <p className="mt-2 text-3xl font-black text-[#0B1120]">{totalLifetimeEarned.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2 text-sm font-bold text-[#64748B]">
            <CreditCard className="size-4 text-[#C9964A]" />
            Recent Top-ups Revenue
          </div>
          <p className="mt-2 text-3xl font-black text-[#0B1120]">
            {recentTopupsEGP.toLocaleString()} <span className="text-lg text-[#64748B]">EGP</span>
          </p>
        </div>
        <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2 text-sm font-bold text-[#64748B]">
            <Package className="size-4 text-[#27AE60]" />
            Active Offers
          </div>
          <p className="mt-2 text-3xl font-black text-[#0B1120]">{activePackagesCount}</p>
        </div>
      </section>

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
                Example: 10 means the client pays 1 EGP to receive 10 points.
              </p>
            </div>
          </div>
          <SubmitButton type="submit" icon={Settings2} className="mt-5 w-full bg-[#27AE60] text-white hover:bg-[#1F8E4F]">
            Save costs
          </SubmitButton>
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
          <SubmitButton type="submit" icon={WalletCards} className="mt-5 w-full bg-[#0B1120] text-white hover:bg-[#1F2937]">
            Apply override
          </SubmitButton>
        </form>
      </section>

      <section className="space-y-5">
        <div className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Package className="size-5 text-[#27AE60]" />
            <div>
              <h2 className="font-black">Marketplace Offers Catalog</h2>
              <p className="text-xs font-semibold text-[#64748B]">
                Admin can create, reorder, activate, or pause buy-points offers without changing code.
              </p>
            </div>
          </div>
          <PackageEditor />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {(pointPackages ?? []).map((pointPackage) => (
            <PackageEditor key={pointPackage.id} pointPackage={pointPackage} />
          ))}
        </div>
      </section>

      <section>
        <form action={updatePaymobSettings} className="rounded-lg border border-[#DDE6E4] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="size-5 text-[#C9964A]" />
            <h2 className="font-black">Paymob API Credentials</h2>
            {paymobSettings?.updated_at && (
              <span className="ml-auto text-xs font-semibold text-[#64748B]">
                Last updated: {new Date(paymobSettings.updated_at).toLocaleDateString('en-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
          <p className="mb-4 text-xs font-semibold text-[#64748B]">
            Leave API Key and HMAC Secret blank to keep existing values. Stored values are used first, then environment variables as fallback.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="API Key (leave blank to keep)" name="api_key" type="password" placeholder="ak_xxxxxxxxxxxxxxxxxxxx" autoComplete="new-password" />
            <Field label="HMAC Secret (leave blank to keep)" name="hmac_secret" type="password" placeholder="xxxxxxxxxxxxxxxxxxxx" autoComplete="new-password" />
            <Field label="Card Integration ID" name="card_integration_id" type="text" defaultValue={paymobSettings?.card_integration_id ?? ''} placeholder="4888832" />
            <Field label="Wallet Integration ID" name="wallet_integration_id" type="text" defaultValue={paymobSettings?.wallet_integration_id ?? ''} placeholder="4888833" />
            <div className="sm:col-span-2">
              <Field label="Card iFrame ID" name="card_iframe_id" type="text" defaultValue={paymobSettings?.card_iframe_id ?? ''} placeholder="916988" />
            </div>
          </div>
          <SubmitButton type="submit" icon={CreditCard} className="mt-5 bg-[#C9964A] text-white hover:bg-[#b8843a]">
            Save Paymob credentials
          </SubmitButton>
        </form>
      </section>

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

      <section className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm">
        <div className="border-b border-[#DDE6E4] px-5 py-4">
          <h2 className="font-black">All Transactions (last 50)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[#F6FAF7]">
              <tr>
                {['User', 'Type', 'Points', 'Balance After', 'EGP', 'Reason', 'Paymob TX ID', 'Date'].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE6E4]">
              {(transactions ?? []).map((tx) => {
                const owner = userById.get(tx.user_id)
                return (
                  <tr key={tx.id} className="transition hover:bg-[#F6FAF7]">
                    <td className="px-4 py-3 font-semibold">{owner?.full_name ?? owner?.email ?? String(tx.user_id ?? '').slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${TX_TYPE_CLASSES[tx.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-black ${Number(tx.points_delta) >= 0 ? 'text-[#27AE60]' : 'text-red-500'}`}>
                      {Number(tx.points_delta) >= 0 ? '+' : ''}
                      {Number(tx.points_delta).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold">{Number(tx.balance_after).toLocaleString()} pts</td>
                    <td className="px-4 py-3 font-semibold text-[#64748B]">
                      {tx.money_amount ? `${Number(tx.money_amount).toLocaleString()} ${tx.currency ?? 'EGP'}` : '-'}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 font-semibold text-[#64748B]">{tx.reason ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">
                      {tx.paymob_transaction_id ? `${tx.paymob_transaction_id.slice(0, 12)}...` : '-'}
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
