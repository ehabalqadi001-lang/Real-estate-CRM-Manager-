'use client'

import { useTransition } from 'react'
import { toggleFlagGlobal, toggleFlagRole } from './actions'
import type { FeatureFlag } from '@/lib/feature-flags'

const ROLES = ['super_admin', 'platform_admin', 'company_admin', 'company_owner', 'sales_manager', 'sales_agent', 'account_manager', 'broker']

interface Props { flag: FeatureFlag }

export function FeatureFlagRow({ flag }: Props) {
  const [pending, start] = useTransition()

  const handleGlobal = (val: boolean) => {
    start(async () => { await toggleFlagGlobal(flag.id, val) })
  }

  const handleRole = (role: string, checked: boolean) => {
    start(async () => { await toggleFlagRole(flag.id, role, checked) })
  }

  return (
    <div className={`rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm ${pending ? 'opacity-60' : ''}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[var(--fi-ink)]">{flag.label}</p>
          {flag.description && <p className="mt-0.5 text-xs font-semibold text-[var(--fi-muted)]">{flag.description}</p>}
          <code className="mt-1 inline-block rounded bg-[var(--fi-soft)] px-1.5 py-0.5 text-xs text-[var(--fi-muted)]">{flag.flag_key}</code>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-xs font-black text-[var(--fi-muted)]">GLOBAL</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={flag.is_global}
              onChange={(e) => handleGlobal(e.target.checked)}
            />
            <div className={`h-6 w-11 rounded-full transition-colors ${flag.is_global ? 'bg-[var(--fi-emerald)]' : 'bg-slate-200'}`} />
            <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${flag.is_global ? 'translate-x-5' : ''}`} />
          </div>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => {
          const active = flag.enabled_roles?.includes(role)
          return (
            <button
              key={role}
              disabled={flag.is_global}
              onClick={() => handleRole(role, !active)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                active
                  ? 'border-[var(--fi-emerald)] bg-[var(--fi-emerald)]/10 text-[var(--fi-emerald)]'
                  : 'border-[var(--fi-line)] text-[var(--fi-muted)] hover:border-[var(--fi-emerald)]/40'
              } disabled:opacity-40`}
            >
              {role.replace(/_/g, ' ')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
