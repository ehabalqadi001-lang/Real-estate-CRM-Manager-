import { requirePermission } from '@/shared/rbac/require-permission'
import { loadPermissionMatrixData } from '@/shared/rbac/dynamic-engine'
import { hasPermission, ROLE_PERMISSIONS } from '@/shared/rbac/permissions'
import type { AppRole } from '@/shared/auth/types'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Users } from 'lucide-react'
import { PermissionToggle } from './PermissionToggle'

export const dynamic = 'force-dynamic'

// Group permissions by resource for column headers
function groupByResource(permissions: Array<{ id: string; key: string; resource: string; action: string; description: string | null }>) {
  const groups: Record<string, typeof permissions> = {}
  for (const p of permissions) {
    if (!groups[p.resource]) groups[p.resource] = []
    groups[p.resource].push(p)
  }
  return groups
}

const RESOURCE_LABELS: Record<string, string> = {
  ads: 'Ads',
  projects: 'Projects',
  transactions: 'Transactions',
  users: 'Users',
  inventory: 'Inventory',
  messages: 'Messages',
  commissions: 'Commissions',
  platform: 'Platform',
}

const ROLE_COLOR: Record<string, string> = {
  super_admin: 'bg-[#C9964A]/20 text-[#C9964A]',
  finance_manager: 'bg-emerald-100 text-emerald-700',
  ad_manager: 'bg-blue-100 text-blue-700',
  data_manager: 'bg-purple-100 text-purple-700',
  am_supervisor: 'bg-indigo-100 text-indigo-700',
  cs_supervisor: 'bg-pink-100 text-pink-700',
  marketing_manager: 'bg-orange-100 text-orange-700',
}

export default async function PermissionMatrixPage() {
  await requirePermission('platform.manage')
  const { profiles, permissions, overrides } = await loadPermissionMatrixData()

  const grouped = groupByResource(permissions)
  const resources = Object.keys(grouped).sort()

  // Build override lookup: Map<userId_permissionId, {granted, id}>
  const overrideLookup = new Map<string, { granted: boolean; permission_id: string }>()
  for (const o of overrides) {
    overrideLookup.set(`${o.user_id}__${o.permission_id}`, {
      granted: o.granted,
      permission_id: o.permission_id,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[#0F8F83]">Super Admin</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-black text-[#102033] dark:text-white">
            <ShieldCheck className="size-8 text-[#C9964A]" />
            Permission Matrix
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Grant or revoke individual permissions per user. Overrides supersede role defaults.
          </p>
        </div>
        <div className="flex gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded border border-[#0F8F83] bg-[#0F8F83] text-center text-white">✓</span>
            Override: Granted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded border border-red-300 bg-red-100 text-center text-red-700">✗</span>
            Override: Revoked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded border border-slate-200 bg-slate-100 text-center text-slate-500">~</span>
            Role Default
          </span>
        </div>
      </div>

      {/* Matrix Table — scrollable */}
      <div className="overflow-x-auto rounded-xl border border-[#DDE6E4] bg-white shadow-sm dark:bg-slate-900">
        <table className="min-w-max border-collapse text-xs">
          <thead>
            {/* Resource group headers */}
            <tr className="border-b border-[#DDE6E4]">
              <th className="sticky left-0 z-10 min-w-[220px] bg-[#F7FAF9] px-4 py-3 text-left font-black text-[#102033] dark:bg-slate-800 dark:text-white">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-[#0F8F83]" />
                  User
                </div>
              </th>
              {resources.map((resource) => (
                <th
                  key={resource}
                  colSpan={grouped[resource].length}
                  className="border-l border-[#DDE6E4] bg-[#F7FAF9] px-2 py-3 text-center font-black text-[#102033] dark:bg-slate-800 dark:text-white"
                >
                  {RESOURCE_LABELS[resource] ?? resource}
                </th>
              ))}
            </tr>
            {/* Permission action sub-headers */}
            <tr className="border-b border-[#DDE6E4] bg-[#F7FAF9] dark:bg-slate-800">
              <th className="sticky left-0 z-10 bg-[#F7FAF9] px-4 py-2 dark:bg-slate-800" />
              {resources.flatMap((resource) =>
                grouped[resource].map((perm) => (
                  <th
                    key={perm.id}
                    title={perm.description ?? perm.key}
                    className="border-l border-[#DDE6E4] px-1.5 py-2 text-center font-semibold capitalize text-slate-500"
                  >
                    {perm.action.replace('_', ' ')}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile, i) => {
              const role = (profile.role ?? 'viewer') as AppRole
              return (
                <tr
                  key={profile.id}
                  className={`border-b border-[#DDE6E4] transition-colors hover:bg-[#EEF6F5]/40 ${i % 2 === 0 ? '' : 'bg-[#FBFCFA] dark:bg-slate-900/50'}`}
                >
                  <td className="sticky left-0 z-10 min-w-[220px] bg-white px-4 py-3 dark:bg-slate-900">
                    <p className="font-black text-[#102033] dark:text-white">{profile.full_name ?? 'Unknown'}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Badge className={`text-[10px] ${ROLE_COLOR[role] ?? 'bg-slate-100 text-slate-600'}`}>
                        {role}
                      </Badge>
                    </div>
                  </td>
                  {resources.flatMap((resource) =>
                    grouped[resource].map((perm) => {
                      const overrideKey = `${profile.id}__${perm.id}`
                      const override = overrideLookup.get(overrideKey)
                      const roleDefault = hasPermission(role, perm.key as import('@/shared/rbac/permissions').Permission)

                      let currentState: 'granted' | 'revoked' | 'default' = 'default'
                      if (override) {
                        currentState = override.granted ? 'granted' : 'revoked'
                      }

                      return (
                        <td key={perm.id} className="border-l border-[#DDE6E4] px-1.5 py-3 text-center">
                          <div className="flex justify-center">
                            <PermissionToggle
                              userId={profile.id}
                              permissionId={perm.id}
                              permissionKey={perm.key}
                              currentState={currentState}
                              defaultGranted={roleDefault}
                            />
                          </div>
                        </td>
                      )
                    }),
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>

        {profiles.length === 0 && (
          <div className="p-12 text-center">
            <p className="font-black text-[#102033] dark:text-white">No users found</p>
          </div>
        )}
      </div>

      <p className="text-xs font-semibold text-slate-400">
        Changes take effect immediately. Role defaults are not modified — only per-user overrides are stored.
      </p>
    </div>
  )
}
