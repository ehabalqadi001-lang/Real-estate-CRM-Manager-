'use client'

import { useTransition } from 'react'
import { toggleFlagGlobal, toggleFlagRole } from './actions'
import type { FeatureFlag } from '@/lib/feature-flags'

const ROLES = ['super_admin', 'platform_admin', 'company_admin', 'company_owner', 'sales_manager', 'sales_agent', 'account_manager', 'broker']

interface Props { flag: FeatureFlag }

export function FeatureFlagRow({ flag }: Props) {
  const [pending, start] = useTransition()

  const handleGlobal = (val: boolean) => {
    start(() => toggleFlagGlobal(flag.id, val))
  }

  const handleRole = (role: string, checked: boolean) => {
    start(() => toggleFlagRole(flag.id, role, checked))
  }

  return (
    <div className={`rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900 ${pending ? 'opacity-60' : ''}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#102033] dark:text-white">{flag.label}</p>
          {flag.description && <p className="mt-0.5 text-xs font-semibold text-slate-500">{flag.description}</p>}
          <code className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{flag.flag_key}</code>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-xs font-black text-slate-500">GLOBAL</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={flag.is_global}
              onChange={(e) => handleGlobal(e.target.checked)}
            />
            <div className={`h-6 w-11 rounded-full transition-colors ${flag.is_global ? 'bg-[#0F8F83]' : 'bg-slate-200'}`} />
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
                  ? 'border-[#0F8F83] bg-[#0F8F83]/10 text-[#0F8F83]'
                  : 'border-[#DDE6E4] text-slate-400 hover:border-[#0F8F83]/40'
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
