import { requirePermission } from '@/shared/rbac/require-permission'
import { getAllFlags } from '@/lib/feature-flags'
import { ToggleLeft, Zap } from 'lucide-react'
import { FeatureFlagRow } from './FeatureFlagRow'

export const dynamic = 'force-dynamic'

export default async function FeatureFlagsPage() {
  await requirePermission('platform.manage')
  const flags = await getAllFlags()

  const globalCount  = flags.filter((f) => f.is_global).length
  const activeCount  = flags.filter((f) => f.is_global || f.enabled_roles.length > 0).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--fi-emerald)]">NEXUS Control Panel</p>
          <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">Feature Flags</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            Enable or disable NEXUS modules per role or company — changes take effect instantly.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-4 py-3 text-center shadow-sm">
            <p className="text-2xl font-black text-[var(--fi-emerald)]">{globalCount}</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">Global</p>
          </div>
          <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-4 py-3 text-center shadow-sm">
            <p className="text-2xl font-black text-[#C9964A]">{activeCount}</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">Active</p>
          </div>
          <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-4 py-3 text-center shadow-sm">
            <p className="text-2xl font-black text-[var(--fi-muted)]">{flags.length}</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">Total</p>
          </div>
        </div>
      </div>

      {flags.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--fi-line)] py-16 text-center">
          <ToggleLeft className="size-10 text-[var(--fi-line)]" />
          <p className="font-bold text-[var(--fi-muted)]">No feature flags configured yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {flags.map((flag) => (
            <FeatureFlagRow key={flag.id} flag={flag} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="size-4 text-[#C9964A]" />
          <p className="text-xs font-black text-[var(--fi-ink)]">How It Works</p>
        </div>
        <ul className="space-y-1 text-xs font-semibold text-[var(--fi-muted)]">
          <li>• <strong>GLOBAL ON</strong> — feature is visible to ALL users regardless of role</li>
          <li>• <strong>Role badges</strong> — click to toggle access for that specific role</li>
          <li>• Changes are instant — no redeploy required</li>
          <li>• Components check flags server-side before rendering</li>
        </ul>
      </div>
    </div>
  )
}
